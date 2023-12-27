import { Hono } from 'npm:hono@3.11.11';

const app = new Hono().basePath('/nodeinfo');

app.get('/2.1', (c) =>
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
