import { Hono } from 'npm:hono@3.11.11';
import { timelineProfilesCache, usersCache } from '@/lib/cache.ts';
import Twitter from '@/x/web_twitter.ts';
import SyndicationTwitter from '@/x/syndication_twitter.ts';
import { xUserToActivityPubPerson } from '@/activitypub/users.ts';
import { xTweetResultToActivityPubNote } from '@/activitypub/notes.ts';

const app = new Hono().basePath('/users');

const twitter = new Twitter(Deno.env.get('X_AUTH_TOKEN'));
const syndicationTwitter = new SyndicationTwitter(Deno.env.get('X_AUTH_TOKEN'));

app.get('/:userId', async (c) => {
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
  if (!c.req.header('accept')?.includes('application/activity+json')) {
    return c.redirect(`https://x.com/intent/user?${new URLSearchParams({
      user_id: userId.toString(),
    })}`);
  }
  const reqUrlObject = new URL(c.req.url);
  let user = usersCache.get(userId);
  if (!user) {
    user = await twitter.getUserByUserId(userId);
    usersCache.set(userId, user);
  }
  return c.json(xUserToActivityPubPerson(user, reqUrlObject), 200, { 'content-type': 'application/activity+json' });
});

// TODO: inboxを作成してフォロー出来るようにする
// app.get('/:username/inbox', async (c) => {
//   const usernameParam = c.req.param('username');
//   if (!usernameParam) {
//     return c.text('400 Bad Request', 400);
//   }
//   const username = String(usernameParam);
//   if (!c.req.header('accept')?.includes('application/activity+json')) {
//     return c.text('400 Bad Request', 400);
//   }
// });

app.get('/:userId/outbox', async (c) => {
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
  if (!c.req.header('accept')?.includes('application/activity+json')) {
    return c.text('400 Bad Request', 400);
  }
  const reqUrlObject = new URL(c.req.url);
  let userTimeline = timelineProfilesCache.get(userId);
  if (!userTimeline) {
    userTimeline = await syndicationTwitter.timelineProfileByUserId(userId);
    timelineProfilesCache.set(userId, userTimeline);
  }
  if (!userTimeline.contextProvider.hasResults) {
    return c.text('404 Not Found', 404);
  }
  let user = usersCache.get(userId);
  if (!user) {
    user = await twitter.getUserByUserId(userId);
    usersCache.set(userId, user);
  }
  // TODO: ここは無駄、userTimeline.timeline.entries[N].content.tweetを使うようにするべき。だけど画像の抽出やリプライ先の抽出が困難
  const tweetResults = await Promise.all(
    userTimeline.timeline.entries.map(({ content: { tweet } }) => syndicationTwitter.tweetResult(BigInt(tweet.id_str))),
  )
  return c.json(
    {
      '@context': [
        'https://www.w3.org/ns/activitystreams',
      ],
      id: `${reqUrlObject.origin}/users/${user.legacy.screen_name}/outbox`,
      type: 'OrderedCollection',
      totalItems: user.legacy.statuses_count,
      orderedItems: await Promise.all(
        tweetResults.map(async (post) => {
          return {
            id: `${reqUrlObject.origin}/users/${post.user.screen_name}/statuses/${post.id_str}`,
            type: 'Create',
            actor: `${reqUrlObject.origin}/users/${post.user.screen_name}`,
            published: post.created_at.toISOString(),
            to: [
              'https://www.w3.org/ns/activitystreams#Public',
            ],
            cc: [
              `${reqUrlObject.origin}/users/${post.user.screen_name}/followers`,
            ],
            object: await xTweetResultToActivityPubNote(post, reqUrlObject),
          }
        }),
      ),
    },
    200,
    { 'content-type': 'application/activity+json' },
  );
});

app.get('/:userId/followers', async (c) => {
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
  if (!c.req.header('accept')?.includes('application/activity+json')) {
    return c.text('400 Bad Request', 400);
  }
  const reqUrlObject = new URL(c.req.url);
  let user = usersCache.get(userId);
  if (!user) {
    user = await twitter.getUserByUserId(userId);
    usersCache.set(userId, user);
  }
  return c.json(
    {
      '@context': 'https://www.w3.org/ns/activitystreams',
      type: 'OrderedCollection',
      id: `${reqUrlObject.origin}/users/${user.legacy.screen_name}/followers`,
      totalItems: user.legacy.followers_count,
    },
    200,
    { 'content-type': 'application/activity+json' },
  );
});

app.get('/:userId/following', async (c) => {
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
  if (!c.req.header('accept')?.includes('application/activity+json')) {
    return c.text('400 Bad Request', 400);
  }
  const reqUrlObject = new URL(c.req.url);
  let user = usersCache.get(userId);
  if (!user) {
    user = await twitter.getUserByUserId(userId);
    usersCache.set(userId, user);
  }
  return c.json(
    {
      '@context': 'https://www.w3.org/ns/activitystreams',
      type: 'OrderedCollection',
      id: `${reqUrlObject.origin}/users/${user.legacy.screen_name}/followers`,
      totalItems: user.legacy.friends_count,
    },
    200,
    { 'content-type': 'application/activity+json' },
  );
});

app.get('/:userId/liked', async (c) => {
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
  if (!c.req.header('accept')?.includes('application/activity+json')) {
    return c.text('400 Bad Request', 400);
  }
  const reqUrlObject = new URL(c.req.url);
  let user = usersCache.get(userId);
  if (!user) {
    user = await twitter.getUserByUserId(userId);
    usersCache.set(userId, user);
  }
  return c.json(
    {
      '@context': 'https://www.w3.org/ns/activitystreams',
      type: 'OrderedCollection',
      id: `${reqUrlObject.origin}/users/${user.legacy.screen_name}/followers`,
      totalItems: user.legacy.favourites_count,
    },
    200,
    { 'content-type': 'application/activity+json' },
  );
});

export default app;
