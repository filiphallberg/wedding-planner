import type { EventState } from '../types';

export function selectTableOccupancyMap(state: EventState): Map<string, number> {
  const occupancyByTable = new Map<string, number>();
  for (const table of state.tables) {
    occupancyByTable.set(table.id, 0);
  }
  for (const assignment of Object.values(state.assignments)) {
    if (!assignment) continue;
    occupancyByTable.set(assignment.tableId, (occupancyByTable.get(assignment.tableId) ?? 0) + 1);
  }
  return occupancyByTable;
}
