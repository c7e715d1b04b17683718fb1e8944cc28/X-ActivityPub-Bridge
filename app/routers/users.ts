import {
  Hono,
  type Context,
} from 'https://deno.land/x/hono@v3.11.7/mod.ts';
import Twitter from '../internal/web_twitter.ts';
import SyndicationTwitter from '../internal/syndication_twitter.ts';

const app = new Hono();

const twitter = new Twitter(Deno.env.get('X_AUTH_TOKEN'));
const syndicationTwitter = new SyndicationTwitter(Deno.env.get('X_AUTH_TOKEN'));

function expandUrl(url: string, urls: { display_url: string, expanded_url: string, url: string, indices: number[] }[]): string {
  for (const url of urls) {
    if (url.url === url.display_url) {
      return url.expanded_url;
    }
  }
  return url;
}

function expandDescription(description: string, urls: { display_url: string, expanded_url: string, url: string, indices: number[] }[]): string {
  urls.forEach((url) => {
    description = description.replace(url.url, url.expanded_url);
  });
  return description;
}

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
  const result = await twitter.getUserByScreenName(String(username));
  // TODO: followers, following, liked を機能させるためにユーザーのresultをデータベースまたはキャッシュに保存する
  return c.json({
    '@context': 'https://www.w3.org/ns/activitystreams',
    type: 'Person',
    id: `${new URL(c.req.url).origin}/users/${result.legacy.screen_name}`,
    name: result.legacy.name,
    preferredUsername: result.legacy.screen_name,
    // TODO: URLを展開したのは良いものの、URLとして認識されない。多分HTMLタグを使わなきゃいけない
    // TODO: メンションが認識されていない
    summary: expandDescription(result.legacy.description, result.legacy.entities.description.urls),
    icon: {
      type: 'Image',
      url: result.legacy.profile_image_url_https.replace('_normal', ''),
    },
    image: result.legacy.profile_banner_url ? {
      type: 'Image',
      url: result.legacy.profile_banner_url,
    } : undefined,
    location: result.legacy.location ? {
      type: 'Place',
      name: result.legacy.location,
    } : undefined,
    url: result.legacy.url ? result.legacy.entities.url ? expandUrl(result.legacy.url, result.legacy.entities.url.urls) : result.legacy.url : undefined,
    published: result.legacy.created_at.toISOString(),
    // TODO: attachment プロパティを用いてProプロフィールや公式のURL、またリポジトリのURLを掲載(検討)する。
    inbox: `${new URL(c.req.url).origin}/users/${result.legacy.screen_name}/inbox`,
    outbox: `${new URL(c.req.url).origin}/users/${result.legacy.screen_name}/outbox`,
    followers: `${new URL(c.req.url).origin}/users/${result.legacy.screen_name}/followers`,
    following: `${new URL(c.req.url).origin}/users/${result.legacy.screen_name}/following`,
    liked: `${new URL(c.req.url).origin}/users/${result.legacy.screen_name}/liked`,
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
  // TODO: outboxの実装
});

app.get('/:username/followers', async (c: Context) => {
  const username = c.req.param('username');
  if (!username) {
    return c.text('400 Bad Request', 400);
  }
  if (!c.req.header('accept')?.includes('application/activity+json')) {
    return c.redirect(`https://x.com/${username}/followers`);
  }
  // TODO: followersの実装
});

app.get('/:username/following', async (c: Context) => {
  const username = c.req.param('username');
  if (!username) {
    return c.text('400 Bad Request', 400);
  }
  if (!c.req.header('accept')?.includes('application/activity+json')) {
    return c.redirect(`https://x.com/${username}/following`);
  }
  // TODO: followingの実装
});

app.get('/:username/liked', async (c: Context) => {
  const username = c.req.param('username');
  if (!username) {
    return c.text('400 Bad Request', 400);
  }
  if (!c.req.header('accept')?.includes('application/activity+json')) {
    return c.redirect(`https://x.com/${username}/likes`);
  }
  // TODO: likedの実装
});

export default app;