import type { CollisionDetection } from '@dnd-kit/core'
import { pointerWithin, rectIntersection } from '@dnd-kit/core'

function isDroppableId(id: string | number): boolean {
  const s = String(id)
  return s === 'unassigned' || s.startsWith('seat:')
}

/** Prefer unassigned / seat slots over nested guest draggables. */
export const weddingCollisionDetection: CollisionDetection = (args) => {
  const pointerHits = pointerWithin(args)
  const droppableHits = pointerHits.filter((h) => isDroppableId(h.id))
  if (droppableHits.length > 0) return droppableHits
  return rectIntersection(args)
}
