import "https://deno.land/std@0.209.0/dotenv/load.ts";
import {
  Hono,
  type Context,
} from 'https://deno.land/x/hono@v3.11.7/mod.ts';

const app = new Hono();

app.route('/.well-known', await import('./routers/.well-known.ts').then((r) => r.default));
app.route('/nodeinfo', await import('./routers/nodeinfo.ts').then((r) => r.default));
app.route('/users', await import('./routers/users.ts').then((r) => r.default));

app.get('/', (c: Context) => c.text('X (Twitter) ActivityPub Bridge'));

Deno.serve(app.fetch);
