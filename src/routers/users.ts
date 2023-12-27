import { type Context, Hono } from "https://deno.land/x/hono@v3.11.7/mod.ts";
import { LRUCache } from "npm:lru-cache@10.1.0";
import Twitter, { type User } from "@/x/web_twitter.ts";
import SyndicationTwitter from "@/x/syndication_twitter.ts";
import { xUserToActivityPubPerson } from "@/activitypub/users.ts";
import { xTweetToActivityPubNote } from "@/activitypub/notes.ts";

const app = new Hono();

export const usersCache = new LRUCache<string, User>({
  // TODO: キャッシュの最大サイズや期間が適当なのでよく考える
  max: 1000,
  ttl: 1000 * 60 * 60,
});

const twitter = new Twitter(Deno.env.get("X_AUTH_TOKEN"));
const syndicationTwitter = new SyndicationTwitter(Deno.env.get("X_AUTH_TOKEN"));

app.get("/:username", async (c: Context) => {
  const username = c.req.param("username");
  if (!username) {
    return c.text("400 Bad Request", 400);
  }
  if (!c.req.header("accept")?.includes("application/activity+json")) {
    return c.redirect(`https://x.com/intent/user?${new URLSearchParams({
      screen_name: username,
    })}`);
  }
  const reqUrlObject = new URL(c.req.url);
  const cachedUser = usersCache.get(String(username));
  if (cachedUser) {
    return c.json(xUserToActivityPubPerson(cachedUser, reqUrlObject), 200, {
      "content-type": "application/activity+json",
    });
  }
  const user = await twitter.getUserByScreenName(String(username));
  // LRU-Cache でテスト
  usersCache.set(String(username), user);
  return c.json(xUserToActivityPubPerson(user, reqUrlObject), 200, {
    "content-type": "application/activity+json",
  });
});

app.get("/:username/inbox", async (c: Context) => {
  const username = c.req.param("username");
  if (!username) {
    return c.text("400 Bad Request", 400);
  }
  if (!c.req.header("accept")?.includes("application/activity+json")) {
    return c.text("400 Bad Request", 400);
  }
  // TODO: inboxの実装
});

app.get("/:username/outbox", async (c: Context) => {
  const username = c.req.param("username");
  if (!username) {
    return c.text("400 Bad Request", 400);
  }
  if (!c.req.header("accept")?.includes("application/activity+json")) {
    return c.text("400 Bad Request", 400);
  }
  const reqUrlObject = new URL(c.req.url);
  const userTimeline = await syndicationTwitter.timelineProfile(username);
  if (!userTimeline.contextProvider.hasResults) {
    return c.text("404 Not Found", 404);
  }
  const cachedUser = usersCache.get(String(username));
  if (cachedUser) {
    return c.json(
      {
        "@context": [
          "https://www.w3.org/ns/activitystreams",
        ],
        id:
          `${reqUrlObject.origin}/users/${cachedUser.legacy.screen_name}/outbox`,
        type: "OrderedCollection",
        totalItems: cachedUser.legacy.statuses_count,
        orderedItems: await Promise.all(
          userTimeline.timeline.entries.map(({ content: { tweet } }) =>
            xTweetToActivityPubNote(tweet, reqUrlObject)
          ),
        ),
      },
      200,
      {
        "content-type": "application/activity+json",
      },
    );
  }
  const user = await twitter.getUserByScreenName(String(username));
  // LRU-Cache でテスト
  usersCache.set(String(username), user);
  return c.json(
    {
      "@context": [
        "https://www.w3.org/ns/activitystreams",
      ],
      id: `${reqUrlObject.origin}/users/${user.legacy.screen_name}/outbox`,
      type: "OrderedCollection",
      totalItems: user.legacy.statuses_count,
      orderedItems: await Promise.all(
        userTimeline.timeline.entries.map(({ content: { tweet } }) =>
          xTweetToActivityPubNote(tweet, reqUrlObject)
        ),
      ),
    },
    200,
    {
      "content-type": "application/activity+json",
    },
  );
});

app.get("/:username/followers", async (c: Context) => {
  const username = c.req.param("username");
  if (!username) {
    return c.text("400 Bad Request", 400);
  }
  if (!c.req.header("accept")?.includes("application/activity+json")) {
    return c.redirect(`https://x.com/${username}/followers`);
  }
  const reqUrlObject = new URL(c.req.url);
  const cachedUser = usersCache.get(String(username));
  if (cachedUser) {
    return c.json(
      {
        "@context": "https://www.w3.org/ns/activitystreams",
        type: "OrderedCollection",
        id:
          `${reqUrlObject.origin}/users/${cachedUser.legacy.screen_name}/followers`,
        totalItems: cachedUser.legacy.followers_count,
      },
      200,
      { "content-type": "application/activity+json" },
    );
  }
  const user = await twitter.getUserByScreenName(String(username));
  // LRU-Cache でテスト
  usersCache.set(String(username), user);
  return c.json(
    {
      "@context": "https://www.w3.org/ns/activitystreams",
      type: "OrderedCollection",
      id: `${reqUrlObject.origin}/users/${user.legacy.screen_name}/followers`,
      totalItems: user.legacy.followers_count,
    },
    200,
    { "content-type": "application/activity+json" },
  );
});

app.get("/:username/following", async (c: Context) => {
  const username = c.req.param("username");
  if (!username) {
    return c.text("400 Bad Request", 400);
  }
  if (!c.req.header("accept")?.includes("application/activity+json")) {
    return c.redirect(`https://x.com/${username}/following`);
  }
  const reqUrlObject = new URL(c.req.url);
  const cachedUser = usersCache.get(String(username));
  if (cachedUser) {
    return c.json(
      {
        "@context": "https://www.w3.org/ns/activitystreams",
        type: "OrderedCollection",
        id:
          `${reqUrlObject.origin}/users/${cachedUser.legacy.screen_name}/followers`,
        totalItems: cachedUser.legacy.friends_count,
      },
      200,
      { "content-type": "application/activity+json" },
    );
  }
  const user = await twitter.getUserByScreenName(String(username));
  // LRU-Cache でテスト
  usersCache.set(String(username), user);
  return c.json(
    {
      "@context": "https://www.w3.org/ns/activitystreams",
      type: "OrderedCollection",
      id: `${reqUrlObject.origin}/users/${user.legacy.screen_name}/followers`,
      totalItems: user.legacy.friends_count,
    },
    200,
    { "content-type": "application/activity+json" },
  );
});

app.get("/:username/liked", async (c: Context) => {
  const username = c.req.param("username");
  if (!username) {
    return c.text("400 Bad Request", 400);
  }
  if (!c.req.header("accept")?.includes("application/activity+json")) {
    return c.redirect(`https://x.com/${username}/likes`);
  }
  const reqUrlObject = new URL(c.req.url);
  const cachedUser = usersCache.get(String(username));
  if (cachedUser) {
    return c.json(
      {
        "@context": "https://www.w3.org/ns/activitystreams",
        type: "OrderedCollection",
        id:
          `${reqUrlObject.origin}/users/${cachedUser.legacy.screen_name}/followers`,
        totalItems: cachedUser.legacy.favourites_count,
      },
      200,
      { "content-type": "application/activity+json" },
    );
  }
  const user = await twitter.getUserByScreenName(String(username));
  // LRU-Cache でテスト
  usersCache.set(String(username), user);
  return c.json(
    {
      "@context": "https://www.w3.org/ns/activitystreams",
      type: "OrderedCollection",
      id: `${reqUrlObject.origin}/users/${user.legacy.screen_name}/followers`,
      totalItems: user.legacy.favourites_count,
    },
    200,
    { "content-type": "application/activity+json" },
  );
});

export default app;
