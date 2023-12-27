import { Hono } from 'npm:hono@3.11.11';
import { timelineProfilesCache } from '@/lib/cache.ts';
import SyndicationTwitter from '@/x/syndication_twitter.ts';

const app = new Hono().basePath('/.well-known');

const syndicationTwitter = new SyndicationTwitter(Deno.env.get('X_AUTH_TOKEN'));

app.get('/nodeinfo', (c) =>
  c.json({
    links: [
      {
        rel: 'http://nodeinfo.diaspora.software/ns/schema/2.1',
        href: `${new URL(c.req.url).origin}/nodeinfo/2.1`,
      },
    ],
  }));

app.get('/host-meta', (c) =>
  c.text(
    `<?xml version="1.0" encoding="UTF-8"?>
<XRD xmlns="http://docs.oasis-open.org/ns/xri/xrd-1.0">
  <Link rel="lrdd" template="${new URL(c.req.url).origin}/.well-known/webfinger?resource={uri}"/>
</XRD>`,
    200,
    { 'content-type': 'application/rdf+xml' },
  ));

app.get('/webfinger', async (c) => {
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
  let timelineProfile = timelineProfilesCache.get(username);
  if (!timelineProfile) {
    timelineProfile = await syndicationTwitter.timelineProfile(username);
    if (!timelineProfile.contextProvider.hasResults) {
      return c.text('404 Not Found', 404);
    }
    timelineProfilesCache.set(username, timelineProfile);
  }
  return c.json({
    subject: `${prefix}:${username}@${hostname}`,
    links: [
      {
        rel: 'http://webfinger.net/rel/profile-page',
        type: 'text/html',
        href: `https://x.com/intent/user?${new URLSearchParams({
          screen_name: username,
        })}`,
      },
      {
        rel: 'self',
        type: 'application/activity+json',
        href: `${new URL(c.req.url).origin}/users/${username}`,
      },
    ],
  });
});

export default app;
