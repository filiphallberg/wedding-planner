import type { Redis } from '@upstash/redis'
import { emptyState, parseWeddingState } from '../src/state/weddingStateCodec'
import type { WeddingState } from '../src/state/types'

export type ProjectMeta = {
  id: string
  name: string
  updatedAt: string
}

export type ProjectRecord = {
  ownerId: string
  name: string
  state: WeddingState
  updatedAt: string
}

const projectKey = (id: string) => `seating:project:${id}`
const indexKey = (userId: string) => `seating:user:${userId}:index`

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

export async function listProjects(redis: Redis, userId: string): Promise<ProjectMeta[]> {
  const list = await readIndex(redis, userId)
  return [...list].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function getProject(
  redis: Redis,
  userId: string,
  projectId: string,
): Promise<ProjectRecord | null> {
  const raw = await redis.get<string>(projectKey(projectId))
  if (!raw) return null
  try {
    const parsed: unknown = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!parsed || typeof parsed !== 'object') return null
    const o = parsed as Record<string, unknown>
    if (o.ownerId !== userId) return null
    if (typeof o.name !== 'string') return null
    const state = parseWeddingState(o.state)
    if (!state) return null
    const updatedAt = typeof o.updatedAt === 'string' ? o.updatedAt : new Date().toISOString()
    return { ownerId: userId, name: o.name, state, updatedAt }
  } catch {
    return null
  }
}

export async function ownsProject(
  redis: Redis,
  userId: string,
  projectId: string,
): Promise<boolean> {
  const rec = await getProject(redis, userId, projectId)
  return rec !== null
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
  const meta: ProjectMeta = { id, name, updatedAt: now }
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
  const now = new Date().toISOString()
  const record: ProjectRecord = {
    ownerId: userId,
    name: existing.name,
    state,
    updatedAt: now,
  }
  await redis.set(projectKey(projectId), JSON.stringify(record))
  const list = await readIndex(redis, userId)
  const next = list.map((m) =>
    m.id === projectId ? { ...m, updatedAt: now } : m,
  )
  await writeIndex(redis, userId, next)
  return { id: projectId, name: existing.name, updatedAt: now }
}

export async function renameProject(
  redis: Redis,
  userId: string,
  projectId: string,
  name: string,
): Promise<ProjectMeta | null> {
  const existing = await getProject(redis, userId, projectId)
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
