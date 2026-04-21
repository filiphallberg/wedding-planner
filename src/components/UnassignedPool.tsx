import { useDroppable } from '@dnd-kit/core';
import type { Guest } from '../state/types';
import { droppableUnassigned } from '../state/useEventState';
import { Button } from '../ui';
import { GuestChip } from './GuestChip';

type Props = {
  guests: Guest[];
  onRemoveGuest: (id: string) => void;
  onEditGuest: (guest: Guest) => void;
  landKeyForGuestId: (guestId: string) => number;
  onAddGuest: () => void;
};

export function UnassignedPool({
  guests,
  onRemoveGuest,
  onEditGuest,
  landKeyForGuestId,
  onAddGuest,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: droppableUnassigned() });

  return (
    <section className="flex min-h-0 flex-1 flex-col space-y-4">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-medium tracking-tight text-stone-600">
          Unassigned ({guests.length})
        </h2>
        <Button type="button" variant="secondary" className="shrink-0 text-xs" onClick={onAddGuest}>
          Add guest
        </Button>
      </div>
      <div
        ref={setNodeRef}
        className={`flex min-h-0 flex-1 flex-col gap-2 overflow-x-auto overflow-y-hidden rounded-lg border border-dashed p-3 transition-colors duration-200 lg:overflow-x-hidden lg:overflow-y-auto ${
          isOver ? 'border-stone-400 bg-stone-100' : 'border-stone-200 bg-white'
        }`}
      >
        {guests.length === 0 ? (
          <p className="text-sm text-stone-500">No unassigned guests.</p>
        ) : (
          <ul className="flex flex-row gap-2 lg:flex-col">
            {guests.map((g) => (
              <li key={g.id} className="shrink-0 lg:shrink">
                <GuestChip
                  id={g.id}
                  name={g.name}
                  specialNeedsNote={g.specialNeedsNote}
                  landKey={landKeyForGuestId(g.id)}
                  onEdit={() => onEditGuest(g)}
                  onRemove={() => onRemoveGuest(g.id)}
                  className="w-48 sm:w-56 lg:w-full"
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
