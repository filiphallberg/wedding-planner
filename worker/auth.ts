import type { ClerkClient } from '@clerk/backend';
import { z } from 'zod';
import { envSchema } from './env';

const userIdSchema = z.string().min(1);

export const authedUserSchema = z.object({
  userId: userIdSchema,
});

export type AuthedUser = z.infer<typeof authedUserSchema>;

export function resolveClerkPublishableKey(env: { VITE_CLERK_PUBLISHABLE_KEY?: string }): string {
  return env.VITE_CLERK_PUBLISHABLE_KEY ?? '';
}

export async function requireUser(
  request: Request,
  clerk: ClerkClient,
  env: { VITE_CLERK_PUBLISHABLE_KEY?: string; CLERK_SECRET_KEY: string },
): Promise<AuthedUser | Response> {
  const parsedEnv = envSchema.safeParse(env);
  if (!parsedEnv.success) {
    return new Response(JSON.stringify({ error: 'Missing Clerk configuration' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const state = await clerk.authenticateRequest(request, {
    publishableKey: resolveClerkPublishableKey(parsedEnv.data),
    secretKey: parsedEnv.data.CLERK_SECRET_KEY,
    acceptsToken: 'session_token',
  });
  if (state.status !== 'signed-in') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const auth = state.toAuth();
  if (!auth.userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const parsedUserId = userIdSchema.safeParse(auth.userId);
  if (!parsedUserId.success) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return { userId: parsedUserId.data };
}

export async function clerkUserEmailAddresses(
  clerk: ClerkClient,
  userId: string,
): Promise<string[]> {
  const parsedUserId = userIdSchema.parse(userId);
  const clerkUser = await clerk.users.getUser(parsedUserId);
  return clerkUser.emailAddresses
    .map((emailAddress) => emailAddress.emailAddress)
    .filter((email): email is string => z.string().email().safeParse(email).success);
}
