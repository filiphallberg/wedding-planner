import type { ClerkClient } from '@clerk/backend';
import { handle, Realtime } from '@upstash/realtime';
import type { Redis } from '@upstash/redis';
import { z } from 'zod';
import { seatingRealtimeSchema } from '../shared/realtimeSchema';
import { requireUser } from './auth';
import type { Env } from './env';
import { canAccessProject } from './projects';

const projectChannelSchema = z.string().regex(/^project:[^:\s]+$/, 'Invalid channel');

export async function handleRealtime(
  request: Request,
  env: Env,
  redis: Redis,
  clerk: ClerkClient,
): Promise<Response> {
  const realtime = new Realtime({ schema: seatingRealtimeSchema, redis });

  const handler = handle({
    realtime,
    middleware: async ({ request: incomingRequest, channels }) => {
      const user = await requireUser(incomingRequest, clerk, env);

      if (user instanceof Response) return user;

      for (const channel of channels) {
        const parsedChannel = projectChannelSchema.safeParse(channel);

        if (!parsedChannel.success) {
          return new Response(JSON.stringify({ error: 'Invalid channel' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        const projectId = parsedChannel.data.slice('project:'.length);
        const canAccess = await canAccessProject(redis, user.userId, projectId);
        if (!canAccess) {
          return new Response(JSON.stringify({ error: 'Forbidden' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }
      return undefined;
    },
  });
  const out = await handler(request);
  if (!out) {
    return new Response('Internal Server Error', { status: 500 });
  }
  return out;
}
