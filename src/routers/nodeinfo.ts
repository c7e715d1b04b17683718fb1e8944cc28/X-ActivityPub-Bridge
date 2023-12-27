import { type Context, Hono } from 'https://deno.land/x/hono@v3.11.7/mod.ts';

const app = new Hono();

app.get('/2.1', (c: Context) =>
  c.json({
    version: '2.1',
    software: {
      name: 'x-activitypub-bridge',
      version: '1.0.0',
    },
    protocols: [
      'activitypub',
    ],
    services: {
      inbound: [],
      outbound: [],
    },
    usage: {
      users: {
        total: 0,
      },
    },
    openRegistrations: false,
    metadata: {
      nodeName: 'X ActivityPub Bridge',
      nodeDescription: 'X ActivityPub Bridge',
    },
  }));

export default app;
