import 'https://deno.land/std@0.209.0/dotenv/load.ts';
import { type Context, Hono } from 'https://deno.land/x/hono@v3.11.7/mod.ts';
import { logger } from 'https://deno.land/x/hono@v3.11.7/middleware.ts';

const app = new Hono();

app.use('*', logger());

app.get('/', (c: Context) => c.text('X (Twitter) ActivityPub Bridge'));

app.route('/.well-known', await import('@/routers/.well-known.ts').then((r) => r.default));
app.route('/nodeinfo', await import('@/routers/nodeinfo.ts').then((r) => r.default));
app.route('/users', await import('@/routers/users.ts').then((r) => r.default));
app.route('/users/:username/collections', await import('@/routers/users/[username]/collections.ts').then((r) => r.default));

Deno.serve(app.fetch);
