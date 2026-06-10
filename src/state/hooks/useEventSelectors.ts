import { useCallback, useMemo } from 'react';
import { DEFAULT_SEAT_COUNT } from '../constants';
import { selectTableOccupancyMap } from '../selectors/tableOccupancyMap';
import { selectTableSeatMap } from '../selectors/tableSeatMap';
import { selectUnassignedGuests } from '../selectors/unassignedGuests';
import type { EventState, Guest } from '../types';

export function useEventSelectors(state: EventState) {
  const unassignedGuests = useMemo(
    () => selectUnassignedGuests(state),
    [state.guests, state.assignments],
  );
  const tableSeatMap = useMemo(
    () => selectTableSeatMap(state),
    [state.tables, state.guests, state.assignments],
  );
  const tableOccupancyMap = useMemo(
    () => selectTableOccupancyMap(state),
    [state.tables, state.assignments],
  );

  const seatsForTable = useCallback(
    (tableId: string): (Guest | null)[] => {
      const slots = tableSeatMap.get(tableId);
      if (slots) return slots;
      return Array.from({ length: DEFAULT_SEAT_COUNT }, () => null);
    },
    [tableSeatMap],
  );

  const tableOccupancy = useCallback(
    (tableId: string) => tableOccupancyMap.get(tableId) ?? 0,
    [tableOccupancyMap],
  );

  return { unassignedGuests, seatsForTable, tableOccupancy };
}
