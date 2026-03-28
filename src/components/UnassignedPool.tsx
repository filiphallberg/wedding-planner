import { useDroppable } from '@dnd-kit/core'
import { GuestChip } from './GuestChip'
import { droppableUnassigned } from '../state/useWeddingState'
import type { Guest } from '../state/types'

type Props = {
  guests: Guest[]
  onRemoveGuest: (id: string) => void
  onEditGuest: (guest: Guest) => void
}

export function UnassignedPool({ guests, onRemoveGuest, onEditGuest }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: droppableUnassigned() })

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-3">
      <h2 className="shrink-0 text-sm font-medium tracking-tight text-stone-600">Unassigned ({guests.length})</h2>
      <div
        ref={setNodeRef}
        className={`flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto rounded-lg border border-dashed p-3 transition-colors ${isOver
          ? 'border-stone-400 bg-stone-100/80'
          : 'border-stone-200 bg-white/80'
          }`}
      >
        {guests.length === 0 ? (
          <p className="text-sm text-stone-400">No unassigned guests.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {guests.map((g) => (
              <li key={g.id}>
                <GuestChip
                  id={g.id}
                  name={g.name}
                  specialNeedsNote={g.specialNeedsNote}
                  onEdit={() => onEditGuest(g)}
                  onRemove={() => onRemoveGuest(g.id)}
                  className="w-full"
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
