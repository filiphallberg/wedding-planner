import { z } from 'zod';

export const envSchema = z.object({
  CLERK_SECRET_KEY: z.string().min(1),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  VITE_UPSTASH_REDIS_REST_URL: z.string().url(),
  VITE_CLERK_PUBLISHABLE_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;
