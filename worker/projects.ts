import type { Redis } from '@upstash/redis';
import { z } from 'zod';
import { emptyState, parseEventState } from '../src/state/eventStateCodec';
import type { EventState } from '../src/state/types';
import {
  indexKey,
  inviteKey,
  membersLegacyKey,
  projectBlobKey,
  projectMemberSetKey,
  projectMetaHashKey,
  sharedKey,
} from './redisKeys';

export const PROJECT_INVITE_TTL_SECONDS = 60 * 60 * 24 * 7;

const nonEmptyStringSchema = z.string().trim().min(1);
const emailSchema = z.string().trim().email();

export const projectRoleSchema = z.enum(['owner', 'member']);
export type ProjectRole = z.infer<typeof projectRoleSchema>;

export const projectMetaSchema = z.object({
  id: nonEmptyStringSchema,
  name: z.string(),
  updatedAt: z.string(),
  role: projectRoleSchema.optional(),
});
export type ProjectMeta = z.infer<typeof projectMetaSchema>;

const eventStateFieldSchema: z.ZodType<EventState> = z.custom<EventState>(
  (val): val is EventState => parseEventState(val) !== null,
);

export const projectRecordSchema = z.object({
  ownerId: nonEmptyStringSchema,
  name: z.string(),
  state: eventStateFieldSchema,
  updatedAt: z.string(),
});
export type ProjectRecord = z.infer<typeof projectRecordSchema>;

/** Redis blob before `parseEventState` on `state` */
const projectRecordBlobSchema = z.object({
  ownerId: nonEmptyStringSchema,
  name: z.string(),
  state: z.unknown(),
  updatedAt: z.string().optional(),
});

const metaFieldsSchema = z.object({
  ownerId: nonEmptyStringSchema,
  name: z.string(),
  updatedAt: z.string(),
});
type MetaFields = z.infer<typeof metaFieldsSchema>;

export const invitePayloadSchema = z.object({
  projectId: nonEmptyStringSchema,
  email: emailSchema,
});
export type InvitePayload = z.infer<typeof invitePayloadSchema>;

export const projectWithRoleSchema = z.object({
  record: projectRecordSchema,
  role: projectRoleSchema,
});
export type ProjectWithRole = z.infer<typeof projectWithRoleSchema>;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function parseStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is string => typeof item === 'string');
}

function parseProjectMetaArray(raw: unknown): ProjectMeta[] {
  const parsed = z.array(projectMetaSchema).safeParse(raw);
  return parsed.success ? parsed.data : [];
}

async function readIndex(redis: Redis, userId: string): Promise<ProjectMeta[]> {
  const raw = await redis.get<string>(indexKey(userId));
  if (!raw) return [];
  try {
    const parsed: unknown = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return parseProjectMetaArray(parsed);
  } catch {
    return [];
  }
}

async function writeIndex(redis: Redis, userId: string, list: ProjectMeta[]): Promise<void> {
  await redis.set(indexKey(userId), JSON.stringify(list));
}

async function readSharedIds(redis: Redis, userId: string): Promise<string[]> {
  const raw = await redis.get<string>(sharedKey(userId));
  if (!raw) return [];
  try {
    const parsed: unknown = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return parseStringArray(parsed);
  } catch {
    return [];
  }
}

async function writeSharedIds(redis: Redis, userId: string, ids: string[]): Promise<void> {
  await redis.set(sharedKey(userId), JSON.stringify(ids));
}

async function readProjectMeta(redis: Redis, projectId: string): Promise<MetaFields | null> {
  const raw = await redis.hgetall(projectMetaHashKey(projectId));
  if (!raw || typeof raw !== 'object') return null;
  const parsed = metaFieldsSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

async function writeProjectMeta(redis: Redis, projectId: string, meta: MetaFields): Promise<void> {
  await redis.hset(projectMetaHashKey(projectId), {
    ownerId: meta.ownerId,
    name: meta.name,
    updatedAt: meta.updatedAt,
  });
}

async function backfillMemberSet(redis: Redis, projectId: string, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const key = projectMemberSetKey(projectId);
  for (const memberUserId of ids) {
    await redis.sadd(key, memberUserId);
  }
}

async function getMemberIdsUnified(redis: Redis, projectId: string): Promise<string[]> {
  const setMembers = await redis.smembers(projectMemberSetKey(projectId));
  const fromSet = Array.isArray(setMembers)
    ? setMembers.filter((memberId): memberId is string => typeof memberId === 'string')
    : [];
  if (fromSet.length > 0) {
    return [...fromSet].sort();
  }
  const raw = await redis.get<string>(membersLegacyKey(projectId));
  if (!raw) return [];
  try {
    const parsed: unknown = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const ids = parseStringArray(parsed);
    if (ids.length > 0) await backfillMemberSet(redis, projectId, ids);
    return [...ids].sort();
  } catch {
    return [];
  }
}

async function writeMembersDual(redis: Redis, projectId: string, ids: string[]): Promise<void> {
  await redis.set(membersLegacyKey(projectId), JSON.stringify(ids));
  await redis.del(projectMemberSetKey(projectId));
  await backfillMemberSet(redis, projectId, ids);
}

export async function readProjectRecordRaw(
  redis: Redis,
  projectId: string,
): Promise<ProjectRecord | null> {
  const parsedProjectId = nonEmptyStringSchema.safeParse(projectId);
  if (!parsedProjectId.success) return null;
  const raw = await redis.get<string>(projectBlobKey(parsedProjectId.data));
  if (!raw) return null;
  try {
    const parsed: unknown = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const parsedRecord = projectRecordBlobSchema.safeParse(parsed);
    if (!parsedRecord.success) return null;
    const state = parseEventState(parsedRecord.data.state);
    if (!state) return null;
    const updatedAt = parsedRecord.data.updatedAt ?? new Date().toISOString();
    return {
      ownerId: parsedRecord.data.ownerId,
      name: parsedRecord.data.name,
      state,
      updatedAt,
    };
  } catch {
    return null;
  }
}

export async function getOwnerId(redis: Redis, projectId: string): Promise<string | null> {
  const meta = await readProjectMeta(redis, projectId);
  if (meta) return meta.ownerId;
  const record = await readProjectRecordRaw(redis, projectId);
  return record?.ownerId ?? null;
}

export async function isOwner(redis: Redis, userId: string, projectId: string): Promise<boolean> {
  const owner = await getOwnerId(redis, projectId);
  return owner === userId;
}

export async function isProjectMember(
  redis: Redis,
  userId: string,
  projectId: string,
): Promise<boolean> {
  const members = await getMemberIdsUnified(redis, projectId);
  return members.includes(userId);
}

export async function canAccessProject(
  redis: Redis,
  userId: string,
  projectId: string,
): Promise<boolean> {
  if (await isOwner(redis, userId, projectId)) return true;
  return isProjectMember(redis, userId, projectId);
}

/** @deprecated use canAccessProject */
export async function ownsProject(
  redis: Redis,
  userId: string,
  projectId: string,
): Promise<boolean> {
  return canAccessProject(redis, userId, projectId);
}

/**
 * Single round-trip friendly path: loads blob + meta + members in parallel, returns access + role.
 */
export async function getProjectWithRole(
  redis: Redis,
  userId: string,
  projectId: string,
): Promise<ProjectWithRole | null> {
  const [meta, blobRaw, setMembers] = await Promise.all([
    readProjectMeta(redis, projectId),
    redis.get(projectBlobKey(projectId)),
    redis.smembers(projectMemberSetKey(projectId)),
  ]);

  let record = parseBlobOrNull(blobRaw);
  if (!record) return null;

  if (meta) {
    record = {
      ...record,
      ownerId: meta.ownerId,
      name: meta.name,
      updatedAt: meta.updatedAt,
    };
  }

  const fromSet = Array.isArray(setMembers)
    ? setMembers.filter((memberId): memberId is string => typeof memberId === 'string')
    : [];
  const memberIds =
    fromSet.length > 0 ? [...fromSet].sort() : await getMemberIdsUnified(redis, projectId);

  const ownerId = record.ownerId;
  const isOwnerUser = ownerId === userId;
  const isMemberUser = memberIds.includes(userId);
  if (!isOwnerUser && !isMemberUser) return null;

  return { record, role: isOwnerUser ? 'owner' : 'member' };
}

function parseBlobOrNull(blobRaw: unknown): ProjectRecord | null {
  if (!blobRaw) return null;
  try {
    const parsed: unknown = typeof blobRaw === 'string' ? JSON.parse(blobRaw) : blobRaw;
    const parsedRecord = projectRecordBlobSchema.safeParse(parsed);
    if (!parsedRecord.success) return null;
    const state = parseEventState(parsedRecord.data.state);
    if (!state) return null;
    const updatedAt = parsedRecord.data.updatedAt ?? new Date().toISOString();
    return {
      ownerId: parsedRecord.data.ownerId,
      name: parsedRecord.data.name,
      state,
      updatedAt,
    };
  } catch {
    return null;
  }
}

export async function listProjects(redis: Redis, userId: string): Promise<ProjectMeta[]> {
  const owned = await readIndex(redis, userId);
  const ownedWithRole: ProjectMeta[] = owned.map((projectMeta) => ({
    ...projectMeta,
    role: 'owner' as const,
  }));

  const sharedIds = await readSharedIds(redis, userId);
  const sharedMetaResults = await Promise.all(
    sharedIds.map(async (sharedProjectId): Promise<ProjectMeta | null> => {
      const member = await isProjectMember(redis, userId, sharedProjectId);
      if (!member) return null;
      const meta = await readProjectMeta(redis, sharedProjectId);
      if (meta) {
        return {
          id: sharedProjectId,
          name: meta.name,
          updatedAt: meta.updatedAt,
          role: 'member' as const,
        };
      }
      const record = await readProjectRecordRaw(redis, sharedProjectId);
      if (!record) return null;
      return {
        id: sharedProjectId,
        name: record.name,
        updatedAt: record.updatedAt,
        role: 'member' as const,
      };
    }),
  );
  const sharedMetas: ProjectMeta[] = sharedMetaResults.filter(
    (projectMeta): projectMeta is ProjectMeta => projectMeta !== null,
  );

  const byId = new Map<string, ProjectMeta>();
  for (const projectMeta of ownedWithRole) byId.set(projectMeta.id, projectMeta);
  for (const projectMeta of sharedMetas) {
    if (!byId.has(projectMeta.id)) byId.set(projectMeta.id, projectMeta);
  }
  return [...byId.values()].sort((projectA, projectB) =>
    projectB.updatedAt.localeCompare(projectA.updatedAt),
  );
}

export async function getProject(
  redis: Redis,
  userId: string,
  projectId: string,
): Promise<ProjectRecord | null> {
  const got = await getProjectWithRole(redis, userId, projectId);
  return got?.record ?? null;
}

export async function createProject(
  redis: Redis,
  userId: string,
  name: string,
): Promise<ProjectMeta> {
  const parsedUserId = nonEmptyStringSchema.parse(userId);
  const parsedName = nonEmptyStringSchema.parse(name);
  const newProjectId = crypto.randomUUID();
  const now = new Date().toISOString();
  const state = emptyState();
  const record: ProjectRecord = {
    ownerId: parsedUserId,
    name: parsedName,
    state,
    updatedAt: now,
  };
  await redis.set(projectBlobKey(newProjectId), JSON.stringify(record));
  await writeProjectMeta(redis, newProjectId, {
    ownerId: parsedUserId,
    name: parsedName,
    updatedAt: now,
  });
  await writeMembersDual(redis, newProjectId, []);
  const list = await readIndex(redis, parsedUserId);
  const meta: ProjectMeta = {
    id: newProjectId,
    name: parsedName,
    updatedAt: now,
    role: 'owner',
  };
  list.push(meta);
  await writeIndex(redis, parsedUserId, list);
  return meta;
}

export async function saveProjectState(
  redis: Redis,
  userId: string,
  projectId: string,
  state: EventState,
): Promise<ProjectMeta | null> {
  const got = await getProjectWithRole(redis, userId, projectId);
  if (!got) return null;
  const { record: existing } = got;
  const ownerId = existing.ownerId;
  const now = new Date().toISOString();
  const record: ProjectRecord = {
    ownerId,
    name: existing.name,
    state,
    updatedAt: now,
  };
  await redis.set(projectBlobKey(projectId), JSON.stringify(record));
  await writeProjectMeta(redis, projectId, {
    ownerId,
    name: existing.name,
    updatedAt: now,
  });

  const ownerList = await readIndex(redis, ownerId);
  const nextOwner = ownerList.map((projectMeta) =>
    projectMeta.id === projectId ? { ...projectMeta, updatedAt: now } : projectMeta,
  );
  await writeIndex(redis, ownerId, nextOwner);

  return { id: projectId, name: existing.name, updatedAt: now };
}

export async function renameProject(
  redis: Redis,
  userId: string,
  projectId: string,
  name: string,
): Promise<ProjectMeta | null> {
  if (!(await isOwner(redis, userId, projectId))) return null;
  const existing = await readProjectRecordRaw(redis, projectId);
  if (!existing) return null;
  const parsedName = nonEmptyStringSchema.safeParse(name);
  if (!parsedName.success) return null;
  const trimmed = parsedName.data;
  const now = new Date().toISOString();
  const record: ProjectRecord = {
    ...existing,
    name: trimmed,
    updatedAt: now,
  };
  await redis.set(projectBlobKey(projectId), JSON.stringify(record));
  await writeProjectMeta(redis, projectId, {
    ownerId: existing.ownerId,
    name: trimmed,
    updatedAt: now,
  });
  const list = await readIndex(redis, userId);
  const updatedProjectList = list.map((projectMeta) =>
    projectMeta.id === projectId ? { ...projectMeta, name: trimmed, updatedAt: now } : projectMeta,
  );
  await writeIndex(redis, userId, updatedProjectList);
  return { id: projectId, name: trimmed, updatedAt: now };
}

export async function createProjectInvite(
  redis: Redis,
  ownerUserId: string,
  projectId: string,
  email: string,
): Promise<{ token: string } | null> {
  if (!(await isOwner(redis, ownerUserId, projectId))) return null;
  const parsedEmail = emailSchema.safeParse(email);
  if (!parsedEmail.success) return null;
  const emailNorm = normalizeEmail(parsedEmail.data);
  const owner = await getOwnerId(redis, projectId);
  if (!owner) return null;

  const token = crypto.randomUUID();
  const payload: InvitePayload = { projectId, email: emailNorm };
  await redis.set(inviteKey(token), JSON.stringify(payload), {
    ex: PROJECT_INVITE_TTL_SECONDS,
  });
  return { token };
}

export async function acceptProjectInvite(
  redis: Redis,
  userId: string,
  token: string,
  userEmails: string[],
): Promise<ProjectMeta | null> {
  const raw = await redis.get<string>(inviteKey(token));
  if (!raw) return null;
  let payload: InvitePayload;
  try {
    const parsed: unknown = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const parsedPayload = invitePayloadSchema.safeParse(parsed);
    if (!parsedPayload.success) return null;
    payload = parsedPayload.data;
  } catch {
    return null;
  }

  const inviteNorm = normalizeEmail(payload.email);
  const normalizedUserEmails = userEmails.map(normalizeEmail);
  if (!normalizedUserEmails.includes(inviteNorm)) return null;

  const ownerId = await getOwnerId(redis, payload.projectId);
  if (!ownerId) return null;
  if (ownerId === userId) return null;

  const members = await getMemberIdsUnified(redis, payload.projectId);
  if (!members.includes(userId)) {
    members.push(userId);
    await redis.set(membersLegacyKey(payload.projectId), JSON.stringify(members));
    await redis.sadd(projectMemberSetKey(payload.projectId), userId);
  }

  const shared = await readSharedIds(redis, userId);
  if (!shared.includes(payload.projectId)) {
    shared.push(payload.projectId);
    await writeSharedIds(redis, userId, shared);
  }

  await redis.del(inviteKey(token));

  const record = await readProjectRecordRaw(redis, payload.projectId);
  if (!record) return null;
  return {
    id: payload.projectId,
    name: record.name,
    updatedAt: record.updatedAt,
    role: 'member',
  };
}

/** Current `updatedAt` for concurrency checks (meta or blob). */
export async function getProjectUpdatedAtForConcurrency(
  redis: Redis,
  projectId: string,
): Promise<string | null> {
  const meta = await readProjectMeta(redis, projectId);
  if (meta) return meta.updatedAt;
  const record = await readProjectRecordRaw(redis, projectId);
  return record?.updatedAt ?? null;
}
