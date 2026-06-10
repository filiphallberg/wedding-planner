import { DndContext } from '@dnd-kit/core';
import { eventCollisionDetection } from '../../collisionDetection';
import { SeatingDialogs } from './components/SeatingDialogs';
import { SeatingDragOverlay } from './components/SeatingDragOverlay';
import { SeatingHeader } from './components/SeatingHeader';
import { SeatingRosterPanel } from './components/SeatingRosterPanel';
import { SeatingTablesSection } from './components/SeatingTablesSection';
import { useSeatingUIContext } from './context/SeatingUIContext';

export function SeatingLayoutShell() {
  const { sensors, drag } = useSeatingUIContext();

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={eventCollisionDetection}
      onDragStart={drag.onDragStart}
      onDragMove={drag.onDragMove}
      onDragEnd={drag.onDragEnd}
      onDragCancel={drag.onDragCancel}
    >
      <div className="flex h-svh max-h-svh w-full max-w-full flex-col overflow-hidden">
        <SeatingHeader />

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
          <SeatingRosterPanel />
          <SeatingTablesSection />
        </div>
      </div>

      <SeatingDragOverlay />
      <SeatingDialogs />
    </DndContext>
  );
}
