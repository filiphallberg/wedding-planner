import type { ExportedHandler } from '@cloudflare/workers-types';
import { app } from './app';
import type { Env } from './env';

export default {
  fetch: app.fetch,
} satisfies ExportedHandler<Env>;
