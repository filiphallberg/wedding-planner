import type { DragEndEvent } from '@dnd-kit/core';
import type { EventState } from '../types';
import { droppableUnassigned, parseSeatDroppable } from './droppables';

export function applyEventDragEnd(prev: EventState, event: DragEndEvent): EventState | null {
  const { active, over } = event;
  if (!over) return null;

  const guestId = String(active.id);
  const overId = String(over.id);

  if (overId === droppableUnassigned()) {
    return {
      ...prev,
      assignments: { ...prev.assignments, [guestId]: null },
    };
  }

  const seat = parseSeatDroppable(overId);
  if (!seat) return null;

  const { tableId, seatIndex } = seat;
  const table = prev.tables.find((t) => t.id === tableId);
  if (!table || seatIndex < 0 || seatIndex >= table.seatCount) return null;

  const occupantId = Object.entries(prev.assignments).find(
    ([gid, val]) =>
      gid !== guestId && val !== null && val.tableId === tableId && val.seatIndex === seatIndex,
  )?.[0];

  const a = { ...prev.assignments };
  if (occupantId) {
    const gA = a[guestId];
    const gB = a[occupantId];
    a[guestId] = gB;
    a[occupantId] = gA;
  } else {
    a[guestId] = { tableId, seatIndex };
  }

  return { ...prev, assignments: a };
}
