import type { ClerkClient } from '@clerk/backend';
import { createClerkClient } from '@clerk/backend';
import { Redis } from '@upstash/redis';
import { resolveClerkPublishableKey } from './auth';
import type { Env } from './env';

export function createRedis(env: Env): Redis {
  return new Redis({
    url: env.VITE_UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });
}

export function createClerkForWorker(env: Env): ClerkClient {
  return createClerkClient({
    secretKey: env.CLERK_SECRET_KEY,
    publishableKey: resolveClerkPublishableKey(env),
  });
}
