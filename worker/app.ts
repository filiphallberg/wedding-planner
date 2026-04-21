import type { ClerkClient } from '@clerk/backend';
import { Realtime } from '@upstash/realtime';
import type { Redis } from '@upstash/redis';
import { Hono } from 'hono';
import { z } from 'zod';
import { seatingRealtimeSchema } from '../shared/realtimeSchema';
import { parseEventState } from '../src/state/eventStateCodec';
import type { AuthedUser } from './auth';
import { clerkUserEmailAddresses, requireUser } from './auth';
import type { Env } from './env';
import {
  acceptProjectInvite,
  createProject,
  createProjectInvite,
  getProjectUpdatedAtForConcurrency,
  getProjectWithRole,
  listProjects,
  PROJECT_INVITE_TTL_SECONDS,
  renameProject,
  saveProjectState,
} from './projects';
import { handleRealtime } from './realtime';
import { createClerkForWorker, createRedis } from './redisContext';

type Variables = {
  redis: Redis;
  clerk: ClerkClient;
  user: AuthedUser;
};

const app = new Hono<{ Bindings: Env; Variables: Variables }>();
const projectIdParamSchema = z.object({
  id: z.string().trim().min(1, 'project id required'),
});
const createProjectBodySchema = z.object({ name: z.string().trim().min(1).optional() }).default({});
const acceptInviteBodySchema = z.object({
  token: z.string().trim().min(1, 'token required'),
});
const createInviteBodySchema = z.object({
  email: z.string().email('email must be valid'),
});
const updateProjectBodySchema = z.object({ state: z.unknown() });
const renameProjectBodySchema = z.object({
  name: z.string().trim().min(1, 'name required'),
});

app.use(async (context, next) => {
  const path = new URL(context.req.url).pathname;
  if (!path.startsWith('/api')) {
    return context.body(null, 404);
  }
  context.set('redis', createRedis(context.env));
  context.set('clerk', createClerkForWorker(context.env));
  await next();
});

app.all('/api/realtime', async (context) => {
  return handleRealtime(context.req.raw, context.env, context.get('redis'), context.get('clerk'));
});

app.use(async (context, next) => {
  if (context.req.path === '/api/realtime') return next();
  const user = await requireUser(context.req.raw, context.get('clerk'), context.env);
  if (user instanceof Response) return user;
  context.set('user', user);
  await next();
});

app.get('/api/projects', async (context) => {
  const list = await listProjects(context.get('redis'), context.get('user').userId);
  return context.json({ projects: list });
});

app.post('/api/projects', async (context) => {
  let raw: unknown = {};
  try {
    raw = await context.req.json();
  } catch {
    raw = {};
  }
  const parsedBody = createProjectBodySchema.safeParse(raw);
  if (!parsedBody.success) {
    return context.json({ error: 'Invalid request body' }, 400);
  }
  const name = parsedBody.data.name ?? 'Untitled';
  const meta = await createProject(context.get('redis'), context.get('user').userId, name);
  return context.json({ project: meta });
});

app.post('/api/invites/accept', async (context) => {
  let raw: unknown;
  try {
    raw = await context.req.json();
  } catch {
    return context.json({ error: 'Invalid JSON' }, 400);
  }
  const parsedBody = acceptInviteBodySchema.safeParse(raw);
  if (!parsedBody.success) return context.json({ error: 'token required' }, 400);
  const token = parsedBody.data.token;
  const emails = await clerkUserEmailAddresses(context.get('clerk'), context.get('user').userId);
  const meta = await acceptProjectInvite(
    context.get('redis'),
    context.get('user').userId,
    token,
    emails,
  );
  if (!meta) {
    return context.json(
      {
        error: 'Invalid or expired invite, or your account email does not match the invitation',
      },
      400,
    );
  }
  return context.json({ project: meta });
});

app.post('/api/projects/:id/invites', async (context) => {
  const projectIdResult = projectIdParamSchema.safeParse(context.req.param());
  if (!projectIdResult.success) return context.json({ error: 'project id required' }, 400);
  const projectId = projectIdResult.data.id;
  let raw: unknown = {};
  try {
    raw = await context.req.json();
  } catch {
    raw = {};
  }
  const parsedBody = createInviteBodySchema.safeParse(raw);
  if (!parsedBody.success) {
    return context.json({ error: 'Only the owner can invite, or the email is invalid' }, 400);
  }
  const email = parsedBody.data.email;
  const created = await createProjectInvite(
    context.get('redis'),
    context.get('user').userId,
    projectId,
    email,
  );
  if (!created) {
    return context.json({ error: 'Only the owner can invite, or the email is invalid' }, 400);
  }
  return context.json({
    invite: {
      token: created.token,
      expiresInSeconds: PROJECT_INVITE_TTL_SECONDS,
    },
  });
});

app.get('/api/projects/:id', async (context) => {
  const projectIdResult = projectIdParamSchema.safeParse(context.req.param());
  if (!projectIdResult.success) return context.json({ error: 'project id required' }, 400);
  const projectId = projectIdResult.data.id;
  const got = await getProjectWithRole(context.get('redis'), context.get('user').userId, projectId);
  if (!got) return context.json({ error: 'Not found' }, 404);
  const { record: projectRecord, role } = got;
  return context.json({
    project: {
      id: projectId,
      name: projectRecord.name,
      updatedAt: projectRecord.updatedAt,
      state: projectRecord.state,
      role,
    },
  });
});

function matchesIfMatch(header: string, serverUpdatedAt: string): boolean {
  if (header === serverUpdatedAt) return true;
  if (header === `"${serverUpdatedAt}"`) return true;
  const unquoted = header.replace(/^"([\s\S]*)"$/, '$1');
  return unquoted === serverUpdatedAt;
}

app.put('/api/projects/:id', async (context) => {
  const projectIdResult = projectIdParamSchema.safeParse(context.req.param());
  if (!projectIdResult.success) return context.json({ error: 'project id required' }, 400);
  const projectId = projectIdResult.data.id;
  const ifMatch = context.req.header('If-Match')?.trim();
  if (ifMatch) {
    const current = await getProjectUpdatedAtForConcurrency(context.get('redis'), projectId);
    if (current !== null && !matchesIfMatch(ifMatch, current)) {
      return context.json({ error: 'Version conflict' }, 409);
    }
  }

  let raw: unknown;
  try {
    raw = await context.req.json();
  } catch {
    return context.json({ error: 'Invalid JSON' }, 400);
  }
  const parsedBody = updateProjectBodySchema.safeParse(raw);
  if (!parsedBody.success) {
    return context.json({ error: 'Invalid seating state' }, 400);
  }
  const state = parseEventState(parsedBody.data.state);
  if (!state) {
    return context.json({ error: 'Invalid seating state' }, 400);
  }
  const meta = await saveProjectState(
    context.get('redis'),
    context.get('user').userId,
    projectId,
    state,
  );
  if (!meta) return context.json({ error: 'Not found' }, 404);

  const redis = context.get('redis');
  const realtime = new Realtime({ schema: seatingRealtimeSchema, redis });
  const channel = realtime.channel(`project:${projectId}`);
  const stateJson = JSON.stringify(state);
  await channel.emit('seating.updated', { stateJson });

  return context.json({ project: meta });
});

app.patch('/api/projects/:id', async (context) => {
  const projectIdResult = projectIdParamSchema.safeParse(context.req.param());
  if (!projectIdResult.success) return context.json({ error: 'project id required' }, 400);
  const projectId = projectIdResult.data.id;
  let raw: unknown;
  try {
    raw = await context.req.json();
  } catch {
    return context.json({ error: 'Invalid JSON' }, 400);
  }
  const parsedBody = renameProjectBodySchema.safeParse(raw);
  if (!parsedBody.success) {
    return context.json({ error: 'name required' }, 400);
  }
  const meta = await renameProject(
    context.get('redis'),
    context.get('user').userId,
    projectId,
    parsedBody.data.name,
  );
  if (!meta) return context.json({ error: 'Not found' }, 404);
  return context.json({ project: meta });
});

export { app };
