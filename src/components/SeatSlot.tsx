import { useDroppable } from '@dnd-kit/core'
import { GuestChip } from './GuestChip'
import { droppableSeat } from '../state/useWeddingState'
import { seatPositionOnEllipse } from '../lib/seatPositions'
import { SEATS_PER_TABLE } from '../state/constants'
import type { Guest } from '../state/types'

type Props = {
  tableId: string
  seatIndex: number
  guest: Guest | null
  onUnseatGuest: (id: string) => void
  onEditGuest: (guest: Guest) => void
}

export function SeatSlot({
  tableId,
  seatIndex,
  guest,
  onUnseatGuest,
  onEditGuest,
}: Props) {
  const id = droppableSeat(tableId, seatIndex)
  const { setNodeRef, isOver } = useDroppable({ id })
  const pos = seatPositionOnEllipse(seatIndex, SEATS_PER_TABLE)

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
