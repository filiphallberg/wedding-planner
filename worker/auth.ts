import type { ClerkClient } from '@clerk/backend'

export type AuthedUser = { userId: string }

export async function requireUser(
  request: Request,
  clerk: ClerkClient,
  env: { CLERK_PUBLISHABLE_KEY: string; CLERK_SECRET_KEY: string },
): Promise<AuthedUser | Response> {
  const state = await clerk.authenticateRequest(request, {
    publishableKey: env.CLERK_PUBLISHABLE_KEY,
    secretKey: env.CLERK_SECRET_KEY,
    acceptsToken: 'session_token',
  })
  if (state.status !== 'signed-in') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  const auth = state.toAuth()
  if (!auth.userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  return { userId: auth.userId }
}
