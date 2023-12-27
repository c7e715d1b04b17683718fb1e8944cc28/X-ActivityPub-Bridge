import { Hono } from 'npm:hono@3.11.11';
import SyndicationTwitter from '@/x/syndication_twitter.ts';
import { xTweetResultToActivityPubNote } from '@/activitypub/notes.ts';

const app = new Hono().basePath('/users/:userId/statuses');

const syndicationTwitter = new SyndicationTwitter(Deno.env.get('X_AUTH_TOKEN'));

app.get('/:statusId', async (c) => {
  // const userIdParam = c.req.param('userId');
  // if (!userIdParam) {
  //   return c.text('400 Bad Request', 400);
  // }
  // try {
  //   BigInt(userIdParam);
  // } catch {
  //   return c.text('400 Bad Request', 400);
  // }
  // const userId = BigInt(userIdParam);
  const statusIdParam = c.req.param('statusId');
  if (!statusIdParam) {
    return c.text('400 Bad Request', 400);
  }
  try {
    BigInt(statusIdParam);
  } catch {
    return c.text('400 Bad Request', 400);
  }
  const statusId = BigInt(statusIdParam);
  if (!c.req.header('accept')?.includes('application/activity+json')) {
    return c.text('400 Bad Request', 400);
  }
  const reqUrlObject = new URL(c.req.url);
  const tweetResult = await syndicationTwitter.tweetResult(statusId);
  return c.json(
    await xTweetResultToActivityPubNote(tweetResult, reqUrlObject),
    200,
    {
      'content-type': 'application/activity+json',
    },
  );
});

export default app;
