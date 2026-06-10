import { DragOverlay } from '@dnd-kit/core';
import { useSeatingUIContext } from '../context/SeatingUIContext';
import { ChipBody } from '../../../components/chip';

export function SeatingDragOverlay() {
  const { drag } = useSeatingUIContext();
  const activeDragGuest = drag.activeDragGuest;

  return (
    <DragOverlay zIndex={200}>
      {activeDragGuest ? (
        <ChipBody
          guest={activeDragGuest.guest}
          actions={false}
          variant="drag"
          className="cursor-grabbing"
        />
      ) : null}
    </DragOverlay>
  );
}
