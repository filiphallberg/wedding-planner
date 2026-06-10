import { useDroppable } from '@dnd-kit/core';
import { useSeatingInteractions } from '../app/seating/context/SeatingInteractionsContext';
import { useEventStateContext } from '../state/context/EventStateContext';
import { droppableUnassigned } from '../state/utils/droppables';
import { Button } from '../ui';
import { cn } from '../utils';
import Chip from './chip';

export function UnassignedPool() {
  const { unassignedGuests } = useEventStateContext();
  const { onOpenAddGuest } = useSeatingInteractions();
  const { setNodeRef, isOver } = useDroppable({ id: droppableUnassigned() });

  return (
    <section className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex shrink-0 items-center justify-between gap-2">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-xs font-bold tracking-wider text-stone-600 uppercase">
            Guests
          </span>
          <span className="font-display text-2xl font-bold text-stone-900">
            {unassignedGuests.length}
          </span>
        </div>
        <Button type="button" variant="secondary" className="shrink-0" onClick={onOpenAddGuest}>
          +
        </Button>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'flex min-h-0 flex-1 flex-col gap-3 overflow-x-auto overflow-y-hidden rounded-2xl border p-3 lg:p-4',
          'transition-[background-color,border-color] duration-200',
          'lg:overflow-x-hidden lg:overflow-y-auto',
          isOver
            ? 'border-stone-400 bg-stone-100'
            : 'border-stone-200/80 border-dashed bg-white/80',
        )}
      >
        {unassignedGuests.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
            <p className="font-display text-base font-semibold text-stone-500">
              No unassigned guests
            </p>
            <p className="text-sm font-medium text-stone-400">Drag a chip here to unseat</p>
          </div>
        ) : (
          <ul
            className={cn(
              'flex flex-row gap-2 touch-pan-x overscroll-x-contain',
              'lg:flex-col lg:gap-3 lg:touch-auto lg:overscroll-auto',
            )}
          >
            {unassignedGuests.map((g) => (
              <li key={g.id} className="shrink-0 lg:shrink">
                <Chip guest={g} scrollable className="w-auto lg:w-full" />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
