import { type Context, Hono } from "https://deno.land/x/hono@v3.11.7/mod.ts";
import Twitter from "@/x/web_twitter.ts";
import SyndicationTwitter from "@/x/syndication_twitter.ts";
import { xTweetResultToActivityPubNote } from "@/activitypub/notes.ts";
import { usersCache } from "@/routers/users.ts";

const app = new Hono();

const twitter = new Twitter(Deno.env.get("X_AUTH_TOKEN"));
const syndicationTwitter = new SyndicationTwitter(Deno.env.get("X_AUTH_TOKEN"));

app.get("/:collectionId", async (c: Context) => {
  const usernameParam = c.req.param("username");
  if (!usernameParam) {
    return c.text("400 Bad Request", 400);
  }
  const username = String(usernameParam);
  const collectionIdParam = c.req.param("collectionId");
  if (!collectionIdParam) {
    return c.text("400 Bad Request", 400);
  }
  const collectionId = String(collectionIdParam);
  const reqUrlObject = new URL(c.req.url);
  if (collectionId === "featured") {
    const cachedUser = usersCache.get(username);
    if (cachedUser) {
      const tweetResults = await Promise.all(
        cachedUser.legacy.pinned_tweet_ids_str.map(
          (tweetId) => syndicationTwitter.tweetResult(BigInt(tweetId)),
        ),
      );
      return c.json(
        {
          "@context": [
            "https://www.w3.org/ns/activitystreams",
          ],
          id: `${reqUrlObject.origin}/users/${username}/collections/featured`,
          type: "OrderedCollection",
          totalItems: tweetResults.length,
          orderedItems: await Promise.all(
            tweetResults.map((post) =>
              xTweetResultToActivityPubNote(post, reqUrlObject)
            ),
          ),
        },
        200,
        {
          "content-type": "application/activity+json",
        },
      );
    }
    const user = await twitter.getUserByScreenName(username);
    // LRU-Cache でテスト
    usersCache.set(username, user);
    const tweetResults = await Promise.all(
      user.legacy.pinned_tweet_ids_str.map(
        (tweetId) => syndicationTwitter.tweetResult(BigInt(tweetId)),
      ),
    );
    return c.json(
      {
        "@context": [
          "https://www.w3.org/ns/activitystreams",
        ],
        id: `${reqUrlObject.origin}/users/${username}/collections/featured`,
        type: "OrderedCollection",
        totalItems: tweetResults.length,
        orderedItems: await Promise.all(
          tweetResults.map((post) =>
            xTweetResultToActivityPubNote(post, reqUrlObject)
          ),
        ),
      },
      200,
      {
        "content-type": "application/activity+json",
      },
    );
  }
  try {
    BigInt(collectionId);
  } catch {
    return c.text("400 Bad Request", 400);
  }
  if (!c.req.header("accept")?.includes("application/activity+json")) {
    return c.redirect(`https://x.com/_/status/${collectionId}`);
  }
  const tweetResult = await syndicationTwitter.tweetResult(
    BigInt(collectionId),
  );
  return c.json(
    await xTweetResultToActivityPubNote(tweetResult, reqUrlObject),
    200,
    {
      "content-type": "application/activity+json",
    },
  );
});

export default app;
