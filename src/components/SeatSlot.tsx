import { useDroppable } from '@dnd-kit/core';
import { seatPositionForShape } from '../lib/seatPositions';
import type { TableShape } from '../state/tableShape';
import type { Guest } from '../state/types';
import { droppableSeat } from '../state/useEventState';
import { GuestChip } from './GuestChip';

type Props = {
  tableId: string;
  seatIndex: number;
  guest: Guest | null;
  shape: TableShape;
  seatCount: number;
  onUnseatGuest: (id: string) => void;
  onEditGuest: (guest: Guest) => void;
  landKeyForGuestId: (guestId: string) => number;
};

export function SeatSlot({
  tableId,
  seatIndex,
  guest,
  shape,
  seatCount,
  onUnseatGuest,
  onEditGuest,
  landKeyForGuestId,
}: Props) {
  const id = droppableSeat(tableId, seatIndex);
  const { setNodeRef, isOver } = useDroppable({ id });
  const pos = seatPositionForShape(seatIndex, seatCount, shape);

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: pos.left, top: pos.top }}
    >
      <div
        ref={setNodeRef}
        className={`flex min-h-11 min-w-22 max-w-33 flex-col items-center justify-center rounded-lg transition-[background-color,border-color] duration-200 ${
          guest
            ? isOver
              ? 'ring-1 ring-stone-400 ring-offset-1 ring-offset-white'
              : ''
            : `border border-dashed border-stone-300 bg-stone-50/90 ${
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
            landKey={landKeyForGuestId(guest.id)}
            onEdit={() => onEditGuest(guest)}
            onRemove={() => onUnseatGuest(guest.id)}
            removeAriaLabel={`Move ${guest.name} to unassigned`}
          />
        ) : (
          <span className="sr-only">Empty seat</span>
        )}
      </div>
    </div>
  );
}
