import type { WeddingState } from './types'
import { parseWeddingState } from './weddingStateCodec'

export { parseWeddingState, emptyState } from './weddingStateCodec'

export const STORAGE_KEY = 'wedding-seating-state'

export function loadState(): WeddingState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return parseWeddingState(JSON.parse(raw))
  } catch {
    return null
  }
}

export function saveState(state: WeddingState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}
