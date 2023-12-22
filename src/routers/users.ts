import {
  Hono,
  type Context,
} from 'https://deno.land/x/hono@v3.11.7/mod.ts';
import { LRUCache } from 'npm:lru-cache@10.1.0';
import Twitter, { type User } from '../internal/web_twitter.ts';
import SyndicationTwitter from '../internal/syndication_twitter.ts';
import {
  expandUrl,
  expandDescription,
  textToHtml,
} from '../utils/formatter.ts';

const app = new Hono();

const usersCache = new LRUCache<string, User>({
  max: 1000,
  ttl: 1000 * 60 * 60,
});

const twitter = new Twitter(Deno.env.get('X_AUTH_TOKEN'));
const syndicationTwitter = new SyndicationTwitter(Deno.env.get('X_AUTH_TOKEN'));

app.get('/:username', async (c: Context) => {
  const username = c.req.param('username');
  if (!username) {
    return c.text('400 Bad Request', 400);
  }
  if (!c.req.header('accept')?.includes('application/activity+json')) {
    return c.redirect(`https://x.com/intent/user?${new URLSearchParams({
      screen_name: username,
    })}`);
  }
  const cachedUser = usersCache.get(String(username));
  if (cachedUser) {
    return c.json({
      '@context': 'https://www.w3.org/ns/activitystreams',
      type: 'Person',
      id: `${new URL(c.req.url).origin}/users/${cachedUser.legacy.screen_name}`,
      name: cachedUser.legacy.name,
      preferredUsername: cachedUser.legacy.screen_name,
      summary: textToHtml(expandDescription(cachedUser.legacy.description, cachedUser.legacy.entities.description.urls)),
      icon: {
        type: 'Image',
        url: cachedUser.legacy.profile_image_url_https.replace('_normal', ''),
      },
      image: cachedUser.legacy.profile_banner_url ? {
        type: 'Image',
        url: cachedUser.legacy.profile_banner_url,
      } : undefined,
      location: cachedUser.legacy.location ? {
        type: 'Place',
        name: cachedUser.legacy.location,
      } : undefined,
      url: cachedUser.legacy.url ? cachedUser.legacy.entities.url ? expandUrl(cachedUser.legacy.url, cachedUser.legacy.entities.url.urls) : cachedUser.legacy.url : undefined,
      published: cachedUser.legacy.created_at.toISOString(),
      // TODO: attachment プロパティを用いてProプロフィールや公式のURL、またリポジトリのURLを掲載(検討)する。
      inbox: `${new URL(c.req.url).origin}/users/${cachedUser.legacy.screen_name}/inbox`,
      outbox: `${new URL(c.req.url).origin}/users/${cachedUser.legacy.screen_name}/outbox`,
      followers: `${new URL(c.req.url).origin}/users/${cachedUser.legacy.screen_name}/followers`,
      following: `${new URL(c.req.url).origin}/users/${cachedUser.legacy.screen_name}/following`,
      liked: `${new URL(c.req.url).origin}/users/${cachedUser.legacy.screen_name}/liked`,
    }, 200, { 'content-type': 'application/activity+json' });
  }
  const user = await twitter.getUserByScreenName(String(username));
  // LRU-Cache でテスト
  usersCache.set(String(username), user);
  return c.json({
    '@context': 'https://www.w3.org/ns/activitystreams',
    type: 'Person',
    id: `${new URL(c.req.url).origin}/users/${user.legacy.screen_name}`,
    name: user.legacy.name,
    preferredUsername: user.legacy.screen_name,
    summary: textToHtml(expandDescription(user.legacy.description, user.legacy.entities.description.urls)),
    icon: {
      type: 'Image',
      url: user.legacy.profile_image_url_https.replace('_normal', ''),
    },
    image: user.legacy.profile_banner_url ? {
      type: 'Image',
      url: user.legacy.profile_banner_url,
    } : undefined,
    location: user.legacy.location ? {
      type: 'Place',
      name: user.legacy.location,
    } : undefined,
    url: user.legacy.url ? user.legacy.entities.url ? expandUrl(user.legacy.url, user.legacy.entities.url.urls) : user.legacy.url : undefined,
    published: user.legacy.created_at.toISOString(),
    // TODO: attachment プロパティを用いてProプロフィールや公式のURL、またリポジトリのURLを掲載(検討)する。
    inbox: `${new URL(c.req.url).origin}/users/${user.legacy.screen_name}/inbox`,
    outbox: `${new URL(c.req.url).origin}/users/${user.legacy.screen_name}/outbox`,
    followers: `${new URL(c.req.url).origin}/users/${user.legacy.screen_name}/followers`,
    following: `${new URL(c.req.url).origin}/users/${user.legacy.screen_name}/following`,
    liked: `${new URL(c.req.url).origin}/users/${user.legacy.screen_name}/liked`,
  }, 200, { 'content-type': 'application/activity+json' });
});

app.get('/:username/inbox', async (c: Context) => {
  const username = c.req.param('username');
  if (!username) {
    return c.text('400 Bad Request', 400);
  }
  if (!c.req.header('accept')?.includes('application/activity+json')) {
    return c.text('400 Bad Request', 400);
  }
  // TODO: inboxの実装
});

app.get('/:username/outbox', async (c: Context) => {
  const username = c.req.param('username');
  if (!username) {
    return c.text('400 Bad Request', 400);
  }
  if (!c.req.header('accept')?.includes('application/activity+json')) {
    return c.text('400 Bad Request', 400);
  }
  const userTimeline = await syndicationTwitter.timelineProfile(username);
  if (!userTimeline.contextProvider.hasResults) {
    return c.text('404 Not Found', 404);
  }
  const cachedUser = usersCache.get(String(username));
  if (cachedUser) {
    return c.json({
      '@context': 'https://www.w3.org/ns/activitystreams',
      type: 'OrderedCollection',
      id: `${new URL(c.req.url).origin}/users/${cachedUser.legacy.screen_name}/outbox`,
      totalItems: cachedUser.legacy.statuses_count,
      // TODO: 何故かノートが表示されない
      orderedItems: userTimeline.timeline.entries.map(({ content: { tweet } }) => ({
        type: 'Note',
        content:tweet.full_text,
      })),
    }, 200, { 'content-type': 'application/activity+json' });
  }
  const user = await twitter.getUserByScreenName(String(username));
  // LRU-Cache でテスト
  usersCache.set(String(username), user);
  return c.json({
    '@context': 'https://www.w3.org/ns/activitystreams',
    type: 'OrderedCollection',
    id: `${new URL(c.req.url).origin}/users/${user.legacy.screen_name}/outbox`,
    totalItems: user.legacy.statuses_count,
    // TODO: 何故かノートが表示されない
    orderedItems: userTimeline.timeline.entries.map(({ content: { tweet } }) => ({
      type: 'Note',
      content:tweet.full_text,
    })),
  }, 200, { 'content-type': 'application/activity+json' });
});

app.get('/:username/followers', async (c: Context) => {
  const username = c.req.param('username');
  if (!username) {
    return c.text('400 Bad Request', 400);
  }
  if (!c.req.header('accept')?.includes('application/activity+json')) {
    return c.redirect(`https://x.com/${username}/followers`);
  }
  const cachedUser = usersCache.get(String(username));
  if (cachedUser) {
    return c.json({
      '@context': 'https://www.w3.org/ns/activitystreams',
      type: 'OrderedCollection',
      id: `${new URL(c.req.url).origin}/users/${cachedUser.legacy.screen_name}/followers`,
      totalItems: cachedUser.legacy.followers_count,
    }, 200, { 'content-type': 'application/activity+json' });
  }
  const user = await twitter.getUserByScreenName(String(username));
  // LRU-Cache でテスト
  usersCache.set(String(username), user);
  return c.json({
    '@context': 'https://www.w3.org/ns/activitystreams',
    type: 'OrderedCollection',
    id: `${new URL(c.req.url).origin}/users/${user.legacy.screen_name}/followers`,
    totalItems: user.legacy.followers_count,
  }, 200, { 'content-type': 'application/activity+json' });
});

app.get('/:username/following', async (c: Context) => {
  const username = c.req.param('username');
  if (!username) {
    return c.text('400 Bad Request', 400);
  }
  if (!c.req.header('accept')?.includes('application/activity+json')) {
    return c.redirect(`https://x.com/${username}/following`);
  }
  const cachedUser = usersCache.get(String(username));
  if (cachedUser) {
    return c.json({
      '@context': 'https://www.w3.org/ns/activitystreams',
      type: 'OrderedCollection',
      id: `${new URL(c.req.url).origin}/users/${cachedUser.legacy.screen_name}/followers`,
      totalItems: cachedUser.legacy.friends_count,
    }, 200, { 'content-type': 'application/activity+json' });
  }
  const user = await twitter.getUserByScreenName(String(username));
  // LRU-Cache でテスト
  usersCache.set(String(username), user);
  return c.json({
    '@context': 'https://www.w3.org/ns/activitystreams',
    type: 'OrderedCollection',
    id: `${new URL(c.req.url).origin}/users/${user.legacy.screen_name}/followers`,
    totalItems: user.legacy.friends_count,
  }, 200, { 'content-type': 'application/activity+json' });
});

app.get('/:username/liked', async (c: Context) => {
  const username = c.req.param('username');
  if (!username) {
    return c.text('400 Bad Request', 400);
  }
  if (!c.req.header('accept')?.includes('application/activity+json')) {
    return c.redirect(`https://x.com/${username}/likes`);
  }
  const cachedUser = usersCache.get(String(username));
  if (cachedUser) {
    return c.json({
      '@context': 'https://www.w3.org/ns/activitystreams',
      type: 'OrderedCollection',
      id: `${new URL(c.req.url).origin}/users/${cachedUser.legacy.screen_name}/followers`,
      totalItems: cachedUser.legacy.favourites_count,
    }, 200, { 'content-type': 'application/activity+json' });
  }
  const user = await twitter.getUserByScreenName(String(username));
  // LRU-Cache でテスト
  usersCache.set(String(username), user);
  return c.json({
    '@context': 'https://www.w3.org/ns/activitystreams',
    type: 'OrderedCollection',
    id: `${new URL(c.req.url).origin}/users/${user.legacy.screen_name}/followers`,
    totalItems: user.legacy.favourites_count,
  }, 200, { 'content-type': 'application/activity+json' });
});

export default app;