import { parseWeddingState } from './weddingStateCodec'
import type { WeddingState } from './types'

const INDEX_KEY = 'wedding-seating-local-projects'
const projectKey = (id: string) => `wedding-seating-local-project:${id}`

export type LocalProjectMeta = { id: string; name: string; updatedAt: string }

function readIndex(): LocalProjectMeta[] {
  try {
    const raw = localStorage.getItem(INDEX_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (x): x is LocalProjectMeta =>
        x !== null &&
        typeof x === 'object' &&
        typeof (x as LocalProjectMeta).id === 'string' &&
        typeof (x as LocalProjectMeta).name === 'string' &&
        typeof (x as LocalProjectMeta).updatedAt === 'string',
    )
  } catch {
    return []
  }
}

function writeIndex(list: LocalProjectMeta[]): void {
  localStorage.setItem(INDEX_KEY, JSON.stringify(list))
}

export function listLocalProjects(): LocalProjectMeta[] {
  return [...readIndex()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export function loadLocalProjectState(projectId: string): WeddingState | null {
  try {
    const raw = localStorage.getItem(projectKey(projectId))
    if (!raw) return null
    return parseWeddingState(JSON.parse(raw))
  } catch {
    return null
  }
}

export function saveLocalProjectState(projectId: string, state: WeddingState): void {
  localStorage.setItem(projectKey(projectId), JSON.stringify(state))
  const list = readIndex()
  const now = new Date().toISOString()
  const next = list.map((m) =>
    m.id === projectId ? { ...m, updatedAt: now } : m,
  )
  writeIndex(next)
}

export function createLocalProject(name: string): LocalProjectMeta {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  const meta: LocalProjectMeta = { id, name: name.trim() || 'Untitled', updatedAt: now }
  const empty: WeddingState = {
    version: 3,
    guests: [],
    tables: [],
    assignments: {},
  }
  localStorage.setItem(projectKey(id), JSON.stringify(empty))
  writeIndex([...readIndex(), meta])
  return meta
}

export function renameLocalProject(projectId: string, name: string): LocalProjectMeta | null {
  const list = readIndex()
  const i = list.findIndex((m) => m.id === projectId)
  if (i === -1) return null
  const trimmed = name.trim()
  if (!trimmed) return null
  const now = new Date().toISOString()
  const meta: LocalProjectMeta = { ...list[i]!, name: trimmed, updatedAt: now }
  const next = [...list]
  next[i] = meta
  writeIndex(next)
  return meta
}

/** One-time migration from legacy single-key storage into first local project. */
export function migrateLegacyLocalStorageIfNeeded(): void {
  if (readIndex().length > 0) return
  try {
    const raw = localStorage.getItem('wedding-seating-state')
    if (!raw) return
    const state = parseWeddingState(JSON.parse(raw))
    if (!state) return
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const meta: LocalProjectMeta = { id, name: 'Main', updatedAt: now }
    localStorage.setItem(projectKey(id), JSON.stringify(state))
    writeIndex([meta])
    localStorage.removeItem('wedding-seating-state')
  } catch {
    /* ignore */
  }
}
