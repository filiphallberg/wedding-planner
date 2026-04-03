import type { WeddingState } from '../state/types'

/** Interchangeable remote persistence boundary (Upstash today; swap API impl later). */
export type WeddingRemoteAdapter = {
  listProjects: () => Promise<{ id: string; name: string; updatedAt: string }[]>
  createProject: (name: string) => Promise<{ id: string; name: string; updatedAt: string }>
  getProject: (id: string) => Promise<{ id: string; name: string; updatedAt: string; state: WeddingState }>
  saveProject: (id: string, state: WeddingState) => Promise<void>
  renameProject: (id: string, name: string) => Promise<{ id: string; name: string; updatedAt: string }>
}
