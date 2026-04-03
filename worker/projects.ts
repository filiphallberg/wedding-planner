import type { Redis } from '@upstash/redis'
import { emptyState, parseWeddingState } from '../src/state/weddingStateCodec'
import type { WeddingState } from '../src/state/types'

export type ProjectRole = 'owner' | 'member'

export type ProjectMeta = {
  id: string
  name: string
  updatedAt: string
  role?: ProjectRole
}

export type ProjectRecord = {
  ownerId: string
  name: string
  state: WeddingState
  updatedAt: string
}

const projectKey = (id: string) => `seating:project:${id}`
const indexKey = (userId: string) => `seating:user:${userId}:index`
const membersKey = (projectId: string) => `seating:project:${projectId}:members`
const sharedKey = (userId: string) => `seating:user:${userId}:shared`
const inviteKey = (token: string) => `seating:invite:${token}`

export const PROJECT_INVITE_TTL_SECONDS = 60 * 60 * 24 * 7

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

async function readIndex(redis: Redis, userId: string): Promise<ProjectMeta[]> {
  const raw = await redis.get<string>(indexKey(userId))
  if (!raw) return []
  try {
    const parsed: unknown = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (x): x is ProjectMeta =>
        x !== null &&
        typeof x === 'object' &&
        typeof (x as ProjectMeta).id === 'string' &&
        typeof (x as ProjectMeta).name === 'string' &&
        typeof (x as ProjectMeta).updatedAt === 'string',
    )
  } catch {
    return []
  }
}

async function writeIndex(redis: Redis, userId: string, list: ProjectMeta[]): Promise<void> {
  await redis.set(indexKey(userId), JSON.stringify(list))
}

async function readSharedIds(redis: Redis, userId: string): Promise<string[]> {
  const raw = await redis.get<string>(sharedKey(userId))
  if (!raw) return []
  try {
    const parsed: unknown = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!Array.isArray(parsed)) return []
    return parsed.filter((x): x is string => typeof x === 'string')
  } catch {
    return []
  }
}

async function writeSharedIds(redis: Redis, userId: string, ids: string[]): Promise<void> {
  await redis.set(sharedKey(userId), JSON.stringify(ids))
}

async function getMemberIds(redis: Redis, projectId: string): Promise<string[]> {
  const raw = await redis.get<string>(membersKey(projectId))
  if (!raw) return []
  try {
    const parsed: unknown = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!Array.isArray(parsed)) return []
    return parsed.filter((x): x is string => typeof x === 'string')
  } catch {
    return []
  }
}

async function setMemberIds(redis: Redis, projectId: string, ids: string[]): Promise<void> {
  await redis.set(membersKey(projectId), JSON.stringify(ids))
}

export async function readProjectRecordRaw(
  redis: Redis,
  projectId: string,
): Promise<ProjectRecord | null> {
  const raw = await redis.get<string>(projectKey(projectId))
  if (!raw) return null
  try {
    const parsed: unknown = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!parsed || typeof parsed !== 'object') return null
    const o = parsed as Record<string, unknown>
    if (typeof o.ownerId !== 'string') return null
    if (typeof o.name !== 'string') return null
    const state = parseWeddingState(o.state)
    if (!state) return null
    const updatedAt = typeof o.updatedAt === 'string' ? o.updatedAt : new Date().toISOString()
    return { ownerId: o.ownerId, name: o.name, state, updatedAt }
  } catch {
    return null
  }
}

export async function getOwnerId(redis: Redis, projectId: string): Promise<string | null> {
  const rec = await readProjectRecordRaw(redis, projectId)
  return rec?.ownerId ?? null
}

export async function isOwner(
  redis: Redis,
  userId: string,
  projectId: string,
): Promise<boolean> {
  const owner = await getOwnerId(redis, projectId)
  return owner === userId
}

export async function isProjectMember(
  redis: Redis,
  userId: string,
  projectId: string,
): Promise<boolean> {
  const members = await getMemberIds(redis, projectId)
  return members.includes(userId)
}

/** Owner or invited collaborator. */
export async function canAccessProject(
  redis: Redis,
  userId: string,
  projectId: string,
): Promise<boolean> {
  if (await isOwner(redis, userId, projectId)) return true
  return isProjectMember(redis, userId, projectId)
}

/** @deprecated use canAccessProject */
export async function ownsProject(
  redis: Redis,
  userId: string,
  projectId: string,
): Promise<boolean> {
  return canAccessProject(redis, userId, projectId)
}

export async function listProjects(redis: Redis, userId: string): Promise<ProjectMeta[]> {
  const owned = await readIndex(redis, userId)
  const ownedWithRole: ProjectMeta[] = owned.map((m) => ({ ...m, role: 'owner' as const }))

  const sharedIds = await readSharedIds(redis, userId)
  const sharedMetas: ProjectMeta[] = []
  for (const id of sharedIds) {
    if (!(await isProjectMember(redis, userId, id))) continue
    const rec = await readProjectRecordRaw(redis, id)
    if (!rec) continue
    sharedMetas.push({
      id,
      name: rec.name,
      updatedAt: rec.updatedAt,
      role: 'member',
    })
  }

  const byId = new Map<string, ProjectMeta>()
  for (const m of ownedWithRole) byId.set(m.id, m)
  for (const m of sharedMetas) {
    if (!byId.has(m.id)) byId.set(m.id, m)
  }
  return [...byId.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function getProject(
  redis: Redis,
  userId: string,
  projectId: string,
): Promise<ProjectRecord | null> {
  if (!(await canAccessProject(redis, userId, projectId))) return null
  const rec = await readProjectRecordRaw(redis, projectId)
  if (!rec) return null
  return rec
}

export async function createProject(
  redis: Redis,
  userId: string,
  name: string,
): Promise<ProjectMeta> {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  const state = emptyState()
  const record: ProjectRecord = {
    ownerId: userId,
    name,
    state,
    updatedAt: now,
  }
  await redis.set(projectKey(id), JSON.stringify(record))
  const list = await readIndex(redis, userId)
  const meta: ProjectMeta = { id, name, updatedAt: now, role: 'owner' }
  list.push(meta)
  await writeIndex(redis, userId, list)
  return meta
}

export async function saveProjectState(
  redis: Redis,
  userId: string,
  projectId: string,
  state: WeddingState,
): Promise<ProjectMeta | null> {
  const existing = await getProject(redis, userId, projectId)
  if (!existing) return null
  const ownerId = existing.ownerId
  const now = new Date().toISOString()
  const record: ProjectRecord = {
    ownerId,
    name: existing.name,
    state,
    updatedAt: now,
  }
  await redis.set(projectKey(projectId), JSON.stringify(record))

  const ownerList = await readIndex(redis, ownerId)
  const nextOwner = ownerList.map((m) =>
    m.id === projectId ? { ...m, updatedAt: now } : m,
  )
  await writeIndex(redis, ownerId, nextOwner)

  return { id: projectId, name: existing.name, updatedAt: now }
}

export async function renameProject(
  redis: Redis,
  userId: string,
  projectId: string,
  name: string,
): Promise<ProjectMeta | null> {
  if (!(await isOwner(redis, userId, projectId))) return null
  const existing = await readProjectRecordRaw(redis, projectId)
  if (!existing) return null
  const trimmed = name.trim()
  if (!trimmed) return null
  const now = new Date().toISOString()
  const record: ProjectRecord = {
    ...existing,
    name: trimmed,
    updatedAt: now,
  }
  await redis.set(projectKey(projectId), JSON.stringify(record))
  const list = await readIndex(redis, userId)
  const next = list.map((m) =>
    m.id === projectId ? { ...m, name: trimmed, updatedAt: now } : m,
  )
  await writeIndex(redis, userId, next)
  return { id: projectId, name: trimmed, updatedAt: now }
}

type InvitePayload = {
  projectId: string
  email: string
}

export async function createProjectInvite(
  redis: Redis,
  ownerUserId: string,
  projectId: string,
  email: string,
): Promise<{ token: string } | null> {
  if (!(await isOwner(redis, ownerUserId, projectId))) return null
  const emailNorm = normalizeEmail(email)
  if (!emailNorm.includes('@')) return null
  const owner = await getOwnerId(redis, projectId)
  if (!owner) return null

  const token = crypto.randomUUID()
  const payload: InvitePayload = { projectId, email: emailNorm }
  await redis.set(inviteKey(token), JSON.stringify(payload), { ex: PROJECT_INVITE_TTL_SECONDS })
  return { token }
}

export async function acceptProjectInvite(
  redis: Redis,
  userId: string,
  token: string,
  userEmails: string[],
): Promise<ProjectMeta | null> {
  const raw = await redis.get<string>(inviteKey(token))
  if (!raw) return null
  let payload: InvitePayload
  try {
    const parsed: unknown = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!parsed || typeof parsed !== 'object') return null
    const o = parsed as Record<string, unknown>
    if (typeof o.projectId !== 'string' || typeof o.email !== 'string') return null
    payload = { projectId: o.projectId, email: o.email }
  } catch {
    return null
  }

  const inviteNorm = normalizeEmail(payload.email)
  const normalizedUserEmails = userEmails.map(normalizeEmail)
  if (!normalizedUserEmails.includes(inviteNorm)) return null

  const ownerId = await getOwnerId(redis, payload.projectId)
  if (!ownerId) return null
  if (ownerId === userId) return null

  const members = await getMemberIds(redis, payload.projectId)
  if (!members.includes(userId)) {
    members.push(userId)
    await setMemberIds(redis, payload.projectId, members)
  }

  const shared = await readSharedIds(redis, userId)
  if (!shared.includes(payload.projectId)) {
    shared.push(payload.projectId)
    await writeSharedIds(redis, userId, shared)
  }

  await redis.del(inviteKey(token))

  const rec = await readProjectRecordRaw(redis, payload.projectId)
  if (!rec) return null
  return {
    id: payload.projectId,
    name: rec.name,
    updatedAt: rec.updatedAt,
    role: 'member',
  }
}
