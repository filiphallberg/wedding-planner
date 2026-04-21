import { z } from 'zod';
import { appUrl } from '../lib/appUrl';
import { parseEventState } from '../state/eventStateCodec';
import type { EventState } from '../state/types';

const projectRoleSchema = z.enum(['owner', 'member']);
const projectMetaSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  updatedAt: z.string(),
  role: projectRoleSchema.optional(),
});
const listProjectsResponseSchema = z.object({
  projects: z.array(projectMetaSchema),
});
const projectResponseSchema = z.object({
  project: projectMetaSchema,
});
const projectNameSchema = z.string().trim().min(1, 'Project name is required');
const projectIdSchema = z.string().min(1, 'Project id is required');
const inviteEmailSchema = z.string().email('Invalid email');
const inviteTokenSchema = z.string().trim().min(1, 'Invite token is required');
const inviteResponseSchema = z.object({
  invite: z.object({
    token: z.string().min(1),
    expiresInSeconds: z.number().int().positive(),
  }),
});

const projectDetailSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  updatedAt: z.string(),
  state: z.unknown(),
  role: projectRoleSchema.optional(),
});

const projectDetailResponseSchema = z.object({
  project: projectDetailSchema,
});

const saveProjectStateSchema = z.custom<EventState>(
  (value) => parseEventState(value) !== null,
  'Invalid seating state',
);

export type ProjectRole = z.infer<typeof projectRoleSchema>;
export type ProjectMeta = z.infer<typeof projectMetaSchema>;

async function parseJson<T>(res: Response, schema: z.ZodType<T>): Promise<T> {
  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error('Invalid JSON from server');
  }
  if (!res.ok) {
    const err = z.object({ error: z.string().optional() }).safeParse(data);
    throw new Error(
      err.success
        ? (err.data.error ?? `Request failed: ${res.status}`)
        : `Request failed: ${res.status}`,
    );
  }
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new Error('Unexpected response from server');
  }
  return parsed.data;
}

export async function listProjectsApi(): Promise<ProjectMeta[]> {
  const res = await fetch(appUrl('/api/projects'), { credentials: 'include' });
  const data = await parseJson(res, listProjectsResponseSchema);
  return data.projects;
}

export async function createProjectApi(name: string): Promise<ProjectMeta> {
  const parsedName = projectNameSchema.parse(name);
  const res = await fetch(appUrl('/api/projects'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: parsedName }),
  });
  const data = await parseJson(res, projectResponseSchema);
  return data.project;
}

export async function getProjectApi(projectId: string): Promise<{
  id: string;
  name: string;
  updatedAt: string;
  state: EventState;
  role?: ProjectRole;
}> {
  const parsedProjectId = projectIdSchema.parse(projectId);
  const res = await fetch(appUrl(`/api/projects/${parsedProjectId}`), {
    credentials: 'include',
  });
  const data = await parseJson(res, projectDetailResponseSchema);
  const parsedState = parseEventState(data.project.state);
  if (!parsedState) {
    throw new Error('Invalid project state from server');
  }
  return { ...data.project, state: parsedState };
}

export async function createProjectInviteApi(
  projectId: string,
  email: string,
): Promise<{ token: string; expiresInSeconds: number }> {
  const parsedProjectId = projectIdSchema.parse(projectId);
  const parsedEmail = inviteEmailSchema.parse(email);
  const res = await fetch(appUrl(`/api/projects/${parsedProjectId}/invites`), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: parsedEmail }),
  });
  const data = await parseJson(res, inviteResponseSchema);
  return data.invite;
}

export async function acceptInviteApi(token: string): Promise<ProjectMeta> {
  const parsedToken = inviteTokenSchema.parse(token);
  const res = await fetch(appUrl('/api/invites/accept'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: parsedToken }),
  });
  const data = await parseJson(res, projectResponseSchema);
  return data.project;
}

export async function saveProjectApi(projectId: string, state: EventState): Promise<void> {
  const parsedProjectId = projectIdSchema.parse(projectId);
  const parsedState = saveProjectStateSchema.parse(state);
  const res = await fetch(appUrl(`/api/projects/${parsedProjectId}`), {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ state: parsedState }),
  });
  await parseJson(res, projectResponseSchema);
}

export async function renameProjectApi(projectId: string, name: string): Promise<ProjectMeta> {
  const parsedProjectId = projectIdSchema.parse(projectId);
  const parsedName = projectNameSchema.parse(name);
  const res = await fetch(appUrl(`/api/projects/${parsedProjectId}`), {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: parsedName }),
  });
  const data = await parseJson(res, projectResponseSchema);
  return data.project;
}
