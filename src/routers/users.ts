import {
  Hono,
  type Context,
} from 'https://deno.land/x/hono@v3.11.7/mod.ts';
import { LRUCache } from 'npm:lru-cache@10.1.0';
import Twitter, { type User } from '../internal/web_twitter.ts';
import SyndicationTwitter from '../internal/syndication_twitter.ts';
import {
  xExpandUrl,
  xExpandDescription,
  textToHtml,
} from '../utils/format.ts';

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
  const reqUrlObject = new URL(c.req.url);
  const cachedUser = usersCache.get(String(username));
  if (cachedUser) {
    const attachment = [];
    if (cachedUser.professional) {
      attachment.push({
        type: 'PropertyValue',
        name: 'Professional',
        value: cachedUser.professional.category[0].name,
      });
    }
    if (cachedUser.legacy.location) {
      attachment.push({
        type: 'PropertyValue',
        name: 'Location',
        value: cachedUser.legacy.location,
      });
    }
    if (cachedUser.legacy.url) {
      attachment.push({
        type: 'PropertyValue',
        name: 'URL',
        value: cachedUser.legacy.entities.url ? textToHtml(xExpandUrl(cachedUser.legacy.url, cachedUser.legacy.entities.url.urls)) : cachedUser.legacy.url,
      });
    }
    // TODO: 誕生日の表示、空の辞書を弾く方法が不明、Object.keys等ではTypeScriptの型が正しくならない
    // if (cachedUser.legacy_extended_profile !== {}) {
    // }
    attachment.push({
      type: 'PropertyValue',
      name: 'X ActivityPub Bridge',
      value: '<a href="https://github.com/c7e715d1b04b17683718fb1e8944cc28/XActivityPubBridge">github.com/c7e715d1b04b17683718fb1e8944cc28/XActivityPubBridge</a>',
    });
    attachment.push({
      type: 'PropertyValue',
      name: 'Original',
      value: `<a href="${`https://x.com/intent/user?${new URLSearchParams({
        screen_name: cachedUser.legacy.screen_name,
      })}`}">@${cachedUser.legacy.screen_name}</a>`,
    });
    return c.json({
      '@context': 'https://www.w3.org/ns/activitystreams',
      type: 'Person',
      id: `${reqUrlObject.origin}/users/${cachedUser.legacy.screen_name}`,
      name: cachedUser.legacy.name,
      preferredUsername: cachedUser.legacy.screen_name,
      // TODO: メンションに対応する
      summary: textToHtml(xExpandDescription(cachedUser.legacy.description, cachedUser.legacy.entities.description.urls)),
      icon: {
        type: 'Image',
        url: cachedUser.legacy.profile_image_url_https.replace('_normal.', '.'),
      },
      image: cachedUser.legacy.profile_banner_url ? {
        type: 'Image',
        url: cachedUser.legacy.profile_banner_url,
      } : undefined,
      location: cachedUser.legacy.location ? {
        type: 'Place',
        name: cachedUser.legacy.location,
      } : undefined,
      url: cachedUser.legacy.url ? cachedUser.legacy.entities.url ? xExpandUrl(cachedUser.legacy.url, cachedUser.legacy.entities.url.urls) : cachedUser.legacy.url : undefined,
      manuallyApprovesFollowers: cachedUser.legacy.protected ?? false,
      published: cachedUser.legacy.created_at.toISOString(),
      attachment,
      inbox: `${reqUrlObject.origin}/users/${cachedUser.legacy.screen_name}/inbox`,
      outbox: `${reqUrlObject.origin}/users/${cachedUser.legacy.screen_name}/outbox`,
      followers: `${reqUrlObject.origin}/users/${cachedUser.legacy.screen_name}/followers`,
      following: `${reqUrlObject.origin}/users/${cachedUser.legacy.screen_name}/following`,
      liked: `${reqUrlObject.origin}/users/${cachedUser.legacy.screen_name}/liked`,
    }, 200, { 'content-type': 'application/activity+json' });
  }
  const user = await twitter.getUserByScreenName(String(username));
  // LRU-Cache でテスト
  usersCache.set(String(username), user);
  const attachment = [];
  if (user.professional) {
    attachment.push({
      type: 'PropertyValue',
      name: 'Professional',
      value: user.professional.category[0].name,
    });
  }
  if (user.legacy.location) {
    attachment.push({
      type: 'PropertyValue',
      name: 'Location',
      value: user.legacy.location,
    });
  }
  if (user.legacy.url) {
    attachment.push({
      type: 'PropertyValue',
      name: 'URL',
      value: user.legacy.entities.url ? textToHtml(xExpandUrl(user.legacy.url, user.legacy.entities.url.urls)) : user.legacy.url,
    });
  }
  // TODO: 誕生日の表示、空の辞書を弾く方法が不明、Object.keys等ではTypeScriptの型が正しくならない
  // if (cachedUser.legacy_extended_profile !== {}) {
  // }
  attachment.push({
    type: 'PropertyValue',
    name: 'X ActivityPub Bridge',
    value: '<a href="https://github.com/c7e715d1b04b17683718fb1e8944cc28/XActivityPubBridge">github.com/c7e715d1b04b17683718fb1e8944cc28/XActivityPubBridge</a>',
  });
  attachment.push({
    type: 'PropertyValue',
    name: 'Original',
    value: `<a href="${`https://x.com/intent/user?${new URLSearchParams({
      screen_name: user.legacy.screen_name,
    })}`}">x.com/@${user.legacy.screen_name}</a>`,
  });
  return c.json({
    '@context': 'https://www.w3.org/ns/activitystreams',
    type: 'Person',
    id: `${reqUrlObject.origin}/users/${user.legacy.screen_name}`,
    name: user.legacy.name,
    preferredUsername: user.legacy.screen_name,
    // TODO: メンションに対応する
    summary: textToHtml(xExpandDescription(user.legacy.description, user.legacy.entities.description.urls)),
    icon: {
      type: 'Image',
      url: user.legacy.profile_image_url_https.replace('_normal.', '.'),
    },
    image: user.legacy.profile_banner_url ? {
      type: 'Image',
      url: user.legacy.profile_banner_url,
    } : undefined,
    location: user.legacy.location ? {
      type: 'Place',
      name: user.legacy.location,
    } : undefined,
    url: user.legacy.url ? user.legacy.entities.url ? xExpandUrl(user.legacy.url, user.legacy.entities.url.urls) : user.legacy.url : undefined,
    manuallyApprovesFollowers: user.legacy.protected ?? false,
    published: user.legacy.created_at.toISOString(),
    attachment,
    inbox: `${reqUrlObject.origin}/users/${user.legacy.screen_name}/inbox`,
    outbox: `${reqUrlObject.origin}/users/${user.legacy.screen_name}/outbox`,
    followers: `${reqUrlObject.origin}/users/${user.legacy.screen_name}/followers`,
    following: `${reqUrlObject.origin}/users/${user.legacy.screen_name}/following`,
    liked: `${reqUrlObject.origin}/users/${user.legacy.screen_name}/liked`,
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
  const reqUrlObject = new URL(c.req.url);
  const userTimeline = await syndicationTwitter.timelineProfile(username);
  if (!userTimeline.contextProvider.hasResults) {
    return c.text('404 Not Found', 404);
  }
  const cachedUser = usersCache.get(String(username));
  if (cachedUser) {
    return c.json({
      '@context': 'https://www.w3.org/ns/activitystreams',
      type: 'OrderedCollection',
      id: `${reqUrlObject.origin}/users/${cachedUser.legacy.screen_name}/outbox`,
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
    id: `${reqUrlObject.origin}/users/${user.legacy.screen_name}/outbox`,
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
  const reqUrlObject = new URL(c.req.url);
  const cachedUser = usersCache.get(String(username));
  if (cachedUser) {
    return c.json({
      '@context': 'https://www.w3.org/ns/activitystreams',
      type: 'OrderedCollection',
      id: `${reqUrlObject.origin}/users/${cachedUser.legacy.screen_name}/followers`,
      totalItems: cachedUser.legacy.followers_count,
    }, 200, { 'content-type': 'application/activity+json' });
  }
  const user = await twitter.getUserByScreenName(String(username));
  // LRU-Cache でテスト
  usersCache.set(String(username), user);
  return c.json({
    '@context': 'https://www.w3.org/ns/activitystreams',
    type: 'OrderedCollection',
    id: `${reqUrlObject.origin}/users/${user.legacy.screen_name}/followers`,
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
  const reqUrlObject = new URL(c.req.url);
  const cachedUser = usersCache.get(String(username));
  if (cachedUser) {
    return c.json({
      '@context': 'https://www.w3.org/ns/activitystreams',
      type: 'OrderedCollection',
      id: `${reqUrlObject.origin}/users/${cachedUser.legacy.screen_name}/followers`,
      totalItems: cachedUser.legacy.friends_count,
    }, 200, { 'content-type': 'application/activity+json' });
  }
  const user = await twitter.getUserByScreenName(String(username));
  // LRU-Cache でテスト
  usersCache.set(String(username), user);
  return c.json({
    '@context': 'https://www.w3.org/ns/activitystreams',
    type: 'OrderedCollection',
    id: `${reqUrlObject.origin}/users/${user.legacy.screen_name}/followers`,
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
  const reqUrlObject = new URL(c.req.url);
  const cachedUser = usersCache.get(String(username));
  if (cachedUser) {
    return c.json({
      '@context': 'https://www.w3.org/ns/activitystreams',
      type: 'OrderedCollection',
      id: `${reqUrlObject.origin}/users/${cachedUser.legacy.screen_name}/followers`,
      totalItems: cachedUser.legacy.favourites_count,
    }, 200, { 'content-type': 'application/activity+json' });
  }
  const user = await twitter.getUserByScreenName(String(username));
  // LRU-Cache でテスト
  usersCache.set(String(username), user);
  return c.json({
    '@context': 'https://www.w3.org/ns/activitystreams',
    type: 'OrderedCollection',
    id: `${reqUrlObject.origin}/users/${user.legacy.screen_name}/followers`,
    totalItems: user.legacy.favourites_count,
  }, 200, { 'content-type': 'application/activity+json' });
});

export default app;