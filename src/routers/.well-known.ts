import {
  Hono,
  type Context,
} from 'https://deno.land/x/hono@v3.11.7/mod.ts';
import SyndicationTwitter from '../internal/syndication_twitter.ts';

const app = new Hono();

const syndicationTwitter = new SyndicationTwitter(Deno.env.get('X_AUTH_TOKEN'));

app.get('/nodeinfo', (c: Context) => c.json({
  links: [
    {
      rel: 'http://nodeinfo.diaspora.software/ns/schema/2.1',
      href: `${new URL(c.req.url).origin}/nodeinfo/2.1`,
    }
  ]
}));

app.get('/webfinger', async (c: Context) => {
  const resource = c.req.query('resource');
  if (!resource) {
    return c.text('400 Bad Request', 400);
  }
  const [prefix, body] = resource.includes(':') ? resource.split(':', 2) : ['acct', resource];
  if (prefix !== 'acct') {
    return c.text('404 Not Found', 404);
  }
  const [username, hostname] = body.split('@', 2);
  if (!username || !hostname) {
    return c.text('400 Bad Request', 400);
  }
  if (hostname !== new URL(c.req.url).hostname) {
    return c.text('404 Not Found', 404);
  }
  const result = await syndicationTwitter.timelineProfile(username);
  if (!result.contextProvider.hasResults) {
    return c.text('404 Not Found', 404);
  }
  return c.json({
    subject: `${prefix}:${username}@${hostname}`,
    links: [
      {
        rel: 'http://webfinger.net/rel/profile-page',
        type: 'text/html',
        href: `https://x.com/intent/user?${new URLSearchParams({
          screen_name: username,
        })}`
      },
      {
        rel: 'self',
        type: 'application/activity+json',
        href: `${new URL(c.req.url).origin}/users/${username}`
      }
    ]
  });
});

export default app;
