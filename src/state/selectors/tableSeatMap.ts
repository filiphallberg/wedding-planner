import type { EventState, Guest } from '../types';

export function selectTableSeatMap(state: EventState): Map<string, (Guest | null)[]> {
  const tableById = new Map(state.tables.map((table) => [table.id, table]));
  const seatsByTable = new Map<string, (Guest | null)[]>();
  const guestById = new Map(state.guests.map((guest) => [guest.id, guest]));

  for (const table of state.tables) {
    seatsByTable.set(
      table.id,
      Array.from({ length: table.seatCount }, () => null),
    );
  }

  for (const [guestId, assignment] of Object.entries(state.assignments)) {
    if (!assignment) continue;
    const table = tableById.get(assignment.tableId);
    const guest = guestById.get(guestId);
    if (!table || !guest) continue;
    if (assignment.seatIndex < 0 || assignment.seatIndex >= table.seatCount) continue;
    seatsByTable.get(table.id)![assignment.seatIndex] = guest;
  }

  return seatsByTable;
}
