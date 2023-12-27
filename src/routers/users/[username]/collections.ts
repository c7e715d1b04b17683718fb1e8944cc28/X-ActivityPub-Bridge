import { Hono } from 'npm:hono@3.11.11';
import { usersCache } from '@/lib/cache.ts';
import Twitter from '@/x/web_twitter.ts';
import SyndicationTwitter from '@/x/syndication_twitter.ts';
import { xTweetResultToActivityPubNote } from '@/activitypub/notes.ts';

const app = new Hono().basePath('/users/:userId/collections');

const twitter = new Twitter(Deno.env.get('X_AUTH_TOKEN'));
const syndicationTwitter = new SyndicationTwitter(Deno.env.get('X_AUTH_TOKEN'));

app.get('/:collectionName', async (c) => {
  const userIdParam = c.req.param('userId');
  if (!userIdParam) {
    return c.text('400 Bad Request', 400);
  }
  try {
    BigInt(userIdParam);
  } catch {
    return c.text('400 Bad Request', 400);
  }
  const userId = BigInt(userIdParam);
  const collectionNameParam = c.req.param('collectionName');
  if (!collectionNameParam) {
    return c.text('400 Bad Request', 400);
  }
  const collectionName = String(collectionNameParam);
  if (!c.req.header('accept')?.includes('application/activity+json')) {
    return c.text('400 Bad Request', 400);
  }
  const reqUrlObject = new URL(c.req.url);
  switch (collectionName) {
    case 'featured': {
      let user = usersCache.get(userId);
      if (!user) {
        user = await twitter.getUserByUserId(userId);
        usersCache.set(userId, user);
      }
      if (user.legacy.protected) {
        return c.text('403 Forbidden', 403);
      }
      const tweetResults = await Promise.all(
        user.legacy.pinned_tweet_ids_str.map(
          (tweetId) => syndicationTwitter.tweetResult(BigInt(tweetId)),
        ),
      );
      return c.json(
        {
          '@context': [
            'https://www.w3.org/ns/activitystreams',
          ],
          id: `${reqUrlObject.origin}/users/${userId}/collections/featured`,
          type: 'OrderedCollection',
          totalItems: tweetResults.length,
          orderedItems: await Promise.all(
            tweetResults.map((post) => xTweetResultToActivityPubNote(post, reqUrlObject)),
          ),
        },
        200,
        {
          'content-type': 'application/activity+json',
        },
      );
    }
    default: {
      return c.text('404 Not Found', 404);
    }
  }
});

export default app;
