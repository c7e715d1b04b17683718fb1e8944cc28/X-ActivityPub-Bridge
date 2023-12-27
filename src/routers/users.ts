import { Hono } from 'npm:hono@3.11.11';
import { timelineProfilesCache, usersCache } from '@/lib/cache.ts';
import Twitter from '@/x/web_twitter.ts';
import SyndicationTwitter from '@/x/syndication_twitter.ts';
import { xUserToActivityPubPerson } from '@/activitypub/users.ts';
import { xTweetToActivityPubNote } from '@/activitypub/notes.ts';

const app = new Hono().basePath('/users');

const twitter = new Twitter(Deno.env.get('X_AUTH_TOKEN'));
const syndicationTwitter = new SyndicationTwitter(Deno.env.get('X_AUTH_TOKEN'));

app.get('/:username', async (c) => {
  const usernameParam = c.req.param('username');
  if (!usernameParam) {
    return c.text('400 Bad Request', 400);
  }
  const username = String(usernameParam);
  if (!c.req.header('accept')?.includes('application/activity+json')) {
    return c.redirect(`https://x.com/intent/user?${new URLSearchParams({
      screen_name: username,
    })}`);
  }
  const reqUrlObject = new URL(c.req.url);
  let user = usersCache.get(username);
  if (!user) {
    user = await twitter.getUserByScreenName(username);
    usersCache.set(username, user);
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

app.get('/:username/outbox', async (c) => {
  const usernameParam = c.req.param('username');
  if (!usernameParam) {
    return c.text('400 Bad Request', 400);
  }
  const username = String(usernameParam);
  if (!c.req.header('accept')?.includes('application/activity+json')) {
    return c.text('400 Bad Request', 400);
  }
  const reqUrlObject = new URL(c.req.url);
  let userTimeline = timelineProfilesCache.get(username);
  if (!userTimeline) {
    userTimeline = await syndicationTwitter.timelineProfile(username);
    timelineProfilesCache.set(username, userTimeline);
  }
  if (!userTimeline.contextProvider.hasResults) {
    return c.text('404 Not Found', 404);
  }
  let user = usersCache.get(username);
  if (!user) {
    user = await twitter.getUserByScreenName(username);
    usersCache.set(username, user);
  }
  return c.json(
    {
      '@context': [
        'https://www.w3.org/ns/activitystreams',
      ],
      id: `${reqUrlObject.origin}/users/${user.legacy.screen_name}/outbox`,
      type: 'OrderedCollection',
      totalItems: user.legacy.statuses_count,
      orderedItems: await Promise.all(
        userTimeline.timeline.entries.map(({ content: { tweet } }) => xTweetToActivityPubNote(tweet, reqUrlObject)),
      ),
    },
    200,
    { 'content-type': 'application/activity+json' },
  );
});

app.get('/:username/followers', async (c) => {
  const usernameParam = c.req.param('username');
  if (!usernameParam) {
    return c.text('400 Bad Request', 400);
  }
  const username = String(usernameParam);
  if (!c.req.header('accept')?.includes('application/activity+json')) {
    return c.redirect(`https://x.com/${username}/followers`);
  }
  const reqUrlObject = new URL(c.req.url);
  let user = usersCache.get(username);
  if (!user) {
    user = await twitter.getUserByScreenName(username);
    usersCache.set(username, user);
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

app.get('/:username/following', async (c) => {
  const usernameParam = c.req.param('username');
  if (!usernameParam) {
    return c.text('400 Bad Request', 400);
  }
  const username = String(usernameParam);
  if (!c.req.header('accept')?.includes('application/activity+json')) {
    return c.redirect(`https://x.com/${username}/following`);
  }
  const reqUrlObject = new URL(c.req.url);
  let user = usersCache.get(username);
  if (!user) {
    user = await twitter.getUserByScreenName(username);
    usersCache.set(username, user);
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

app.get('/:username/liked', async (c) => {
  const usernameParam = c.req.param('username');
  if (!usernameParam) {
    return c.text('400 Bad Request', 400);
  }
  const username = String(usernameParam);
  if (!c.req.header('accept')?.includes('application/activity+json')) {
    return c.redirect(`https://x.com/${username}/likes`);
  }
  const reqUrlObject = new URL(c.req.url);
  let user = usersCache.get(username);
  if (!user) {
    user = await twitter.getUserByScreenName(username);
    usersCache.set(username, user);
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
