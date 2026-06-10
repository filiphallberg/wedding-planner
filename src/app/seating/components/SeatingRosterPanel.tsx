import type { CSSProperties } from 'react';
import { UnassignedPool } from '../../../components/UnassignedPool';
import { cn } from '../../../utils';
import { useSeatingUIContext } from '../context/SeatingUIContext';
import { RosterResizeHandle } from './RosterResizeHandle';

export function SeatingRosterPanel() {
  const { roster } = useSeatingUIContext();

  return (
    <>
      <aside
        style={{ '--roster-width': `${roster.rosterWidth}px` } as CSSProperties}
        className={cn(
          'flex min-h-0 w-full shrink-0 flex-col overflow-hidden',
          'max-h-[40svh] lg:max-h-none lg:h-full lg:w-(--roster-width) lg:max-w-[min(100%,520px)] lg:min-w-[220px]',
          'border-b border-stone-200/70 bg-white lg:border-b-0 lg:border-r',
          'p-3 sm:p-6',
        )}
      >
        <UnassignedPool />
      </aside>

      <RosterResizeHandle
        onPointerDown={roster.onRosterResizePointerDown}
        onPointerMove={roster.onRosterResizePointerMove}
        onPointerUp={roster.onRosterResizePointerUp}
      />
    </>
  );
}
