import { DragOverlay } from '@dnd-kit/core';
import { GuestChipBody } from '../../../components/GuestChip';
import { useSeatingUIContext } from '../context/SeatingUIContext';

export function SeatingDragOverlay() {
  const { drag } = useSeatingUIContext();
  const activeDragGuest = drag.activeDragGuest;

  return (
    <DragOverlay zIndex={200}>
      {activeDragGuest ? (
        <GuestChipBody
          name={activeDragGuest.guest.name}
          specialNeedsNote={activeDragGuest.guest.specialNeedsNote}
          compact={activeDragGuest.compact}
          showActions={false}
          variant="dragOverlay"
          className="cursor-grabbing"
        />
      ) : null}
    </DragOverlay>
  );
}
