import type { DragEndEvent, DragMoveEvent, DragStartEvent } from '@dnd-kit/core';
import { useCallback, useState } from 'react';
import type { Guest } from '../../../state/types';

type ActiveDragGuest = { guest: Guest; compact: boolean } | null;

type Options = {
  guests: Guest[];
  handleDragEnd: (event: DragEndEvent) => string[];
  recordGuestLandings: (guestIds: string[]) => void;
};

export function useSeatingDrag({ guests, handleDragEnd, recordGuestLandings }: Options) {
  const [activeDragGuest, setActiveDragGuest] = useState<ActiveDragGuest>(null);
  const [dragPointer, setDragPointer] = useState<{ x: number; y: number } | null>(null);

  const clearDrag = useCallback(() => {
    setActiveDragGuest(null);
    setDragPointer(null);
  }, []);

  const onDragStart = useCallback(
    (event: DragStartEvent) => {
      const guestId = String(event.active.id);
      const guest = guests.find((g) => g.id === guestId);
      if (!guest) {
        setActiveDragGuest(null);
        return;
      }
      const compact = Boolean(event.active.data.current?.compact);
      setActiveDragGuest({ guest, compact });
    },
    [guests],
  );

  const onDragMove = useCallback((event: DragMoveEvent) => {
    const rect = event.active.rect.current.translated;
    if (!rect) return;
    setDragPointer({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
  }, []);

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      clearDrag();
      recordGuestLandings(handleDragEnd(event));
    },
    [clearDrag, handleDragEnd, recordGuestLandings],
  );

  const onDragCancel = clearDrag;

  return { activeDragGuest, dragPointer, onDragStart, onDragMove, onDragEnd, onDragCancel };
}
