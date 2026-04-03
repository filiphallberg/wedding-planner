import type { ClerkClient } from "@clerk/backend";

export type AuthedUser = { userId: string };

export function resolveClerkPublishableKey(env: {
  VITE_CLERK_PUBLISHABLE_KEY?: string;
}): string {
  return env.VITE_CLERK_PUBLISHABLE_KEY ?? "";
}

export async function requireUser(
  request: Request,
  clerk: ClerkClient,
  env: { VITE_CLERK_PUBLISHABLE_KEY?: string; CLERK_SECRET_KEY: string }
): Promise<AuthedUser | Response> {
  const state = await clerk.authenticateRequest(request, {
    publishableKey: resolveClerkPublishableKey(env),
    secretKey: env.CLERK_SECRET_KEY,
    acceptsToken: "session_token",
  });
  if (state.status !== "signed-in") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  const auth = state.toAuth();
  if (!auth.userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return { userId: auth.userId };
}

export async function clerkUserEmailAddresses(
  clerk: ClerkClient,
  userId: string
): Promise<string[]> {
  const u = await clerk.users.getUser(userId);
  return u.emailAddresses.map((e) => e.emailAddress);
}
