import { MAX_SEATS_PER_TABLE } from '../constants';

export function droppableUnassigned(): string {
  return 'unassigned';
}

export function droppableSeat(tableId: string, seatIndex: number): string {
  return `seat:${tableId}:${seatIndex}`;
}

export function parseSeatDroppable(id: string): { tableId: string; seatIndex: number } | null {
  if (!id.startsWith('seat:')) return null;
  const rest = id.slice('seat:'.length);
  const lastColon = rest.lastIndexOf(':');
  if (lastColon === -1) return null;
  const tableId = rest.slice(0, lastColon);
  const seatIndex = Number.parseInt(rest.slice(lastColon + 1), 10);
  if (!Number.isFinite(seatIndex) || seatIndex < 0 || seatIndex >= MAX_SEATS_PER_TABLE) {
    return null;
  }
  return { tableId, seatIndex };
}
