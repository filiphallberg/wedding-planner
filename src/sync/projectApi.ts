import { appUrl } from '../lib/appUrl'
import type { WeddingState } from '../state/types'
import type { WeddingRemoteAdapter } from './adapterTypes'

export type ProjectMeta = {
  id: string
  name: string
  updatedAt: string
}

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text()
  let data: unknown
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    throw new Error('Invalid JSON from server')
  }
  if (!res.ok) {
    const err = data as { error?: string }
    throw new Error(err.error ?? `Request failed: ${res.status}`)
  }
  return data as T
}

export async function listProjectsApi(): Promise<ProjectMeta[]> {
  const res = await fetch(appUrl('/api/projects'), { credentials: 'include' })
  const data = await parseJson<{ projects: ProjectMeta[] }>(res)
  return data.projects
}

export async function createProjectApi(name: string): Promise<ProjectMeta> {
  const res = await fetch(appUrl('/api/projects'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  const data = await parseJson<{ project: ProjectMeta }>(res)
  return data.project
}

export async function getProjectApi(projectId: string): Promise<{
  id: string
  name: string
  updatedAt: string
  state: WeddingState
}> {
  const res = await fetch(appUrl(`/api/projects/${projectId}`), {
    credentials: 'include',
  })
  const data = await parseJson<{
    project: { id: string; name: string; updatedAt: string; state: WeddingState }
  }>(res)
  return data.project
}

export async function saveProjectApi(projectId: string, state: WeddingState): Promise<void> {
  const res = await fetch(appUrl(`/api/projects/${projectId}`), {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ state }),
  })
  await parseJson<{ project: ProjectMeta }>(res)
}

export async function renameProjectApi(projectId: string, name: string): Promise<ProjectMeta> {
  const res = await fetch(appUrl(`/api/projects/${projectId}`), {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  const data = await parseJson<{ project: ProjectMeta }>(res)
  return data.project
}

export const weddingRemoteAdapter: WeddingRemoteAdapter = {
  listProjects: listProjectsApi,
  createProject: createProjectApi,
  getProject: getProjectApi,
  saveProject: saveProjectApi,
  renameProject: renameProjectApi,
}
