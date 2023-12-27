import 'https://deno.land/std@0.209.0/dotenv/load.ts';
import { Hono } from 'npm:hono@3.11.11';
import { logger } from 'npm:hono@3.11.11/logger';

const app = new Hono();

app.use('*', logger());

app.get('/', (c) => c.text('X (Twitter) ActivityPub Bridge'));

app.route('', await import('@/routers/.well-known.ts').then((r) => r.default));
app.route('', await import('@/routers/nodeinfo.ts').then((r) => r.default));
app.route('', await import('@/routers/users.ts').then((r) => r.default));
app.route('', await import('@/routers/users/[username]/collections.ts').then((r) => r.default));
app.route('', await import('@/routers/users/[username]/statuses.ts').then((r) => r.default));

Deno.serve(app.fetch);
