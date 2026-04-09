import { useDroppable } from '@dnd-kit/core'
import { GuestChip } from './GuestChip'
import { seatPositionForShape } from '../lib/seatPositions'
import { droppableSeat } from '../state/useWeddingState'
import type { TableShape } from '../state/tableShape'
import type { Guest } from '../state/types'

type Props = {
  tableId: string
  seatIndex: number
  guest: Guest | null
  shape: TableShape
  seatCount: number
  onUnseatGuest: (id: string) => void
  onEditGuest: (guest: Guest) => void
}

export function SeatSlot({
  tableId,
  seatIndex,
  guest,
  shape,
  seatCount,
  onUnseatGuest,
  onEditGuest,
}: Props) {
  const id = droppableSeat(tableId, seatIndex)
  const { setNodeRef, isOver } = useDroppable({ id })
  const pos = seatPositionForShape(seatIndex, seatCount, shape)

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: pos.left, top: pos.top }}
    >
      <div
        ref={setNodeRef}
        className={`flex min-h-11 min-w-22 max-w-33 flex-col items-center justify-center rounded-md transition-colors ${
          guest
            ? isOver
              ? 'ring-1 ring-stone-400 ring-offset-1 ring-offset-white'
              : ''
            : `border border-dashed border-stone-300 bg-stone-50/80 ${
                isOver ? 'border-stone-500 bg-stone-100' : ''
              }`
        }`}
        aria-label={guest ? `Seat ${seatIndex + 1}, ${guest.name}` : `Empty seat ${seatIndex + 1}`}
      >
        {guest ? (
          <GuestChip
            id={guest.id}
            name={guest.name}
            specialNeedsNote={guest.specialNeedsNote}
            compact
            onEdit={() => onEditGuest(guest)}
            onRemove={() => onUnseatGuest(guest.id)}
            removeAriaLabel={`Move ${guest.name} to unassigned`}
          />
        ) : (
          <span className="sr-only">Empty seat</span>
        )}
      </div>
    </div>
  )
}
