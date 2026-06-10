import { DEFAULT_TABLE_PALETTE_ID, type TablePaletteId } from '../../lib/tablePalettes';
import { DEFAULT_SEAT_COUNT, MAX_SEATS_PER_TABLE } from '../constants';
import type { TableShape } from '../tableShape';
import type { EventState, SeatAssignment, Table } from '../types';
import { newId } from './newId';

function clampSeatCount(n: number): number {
  let seatCount = Math.round(n);
  if (seatCount < 1) seatCount = 1;
  if (seatCount > MAX_SEATS_PER_TABLE) seatCount = MAX_SEATS_PER_TABLE;
  return seatCount;
}

export function addTableToState(
  state: EventState,
  label: string,
  opts?: { seatCount?: number; shape?: TableShape; paletteId?: TablePaletteId },
): EventState | null {
  const trimmed = label.trim();
  if (!trimmed) return null;
  const table: Table = {
    id: newId(),
    label: trimmed,
    paletteId: opts?.paletteId ?? DEFAULT_TABLE_PALETTE_ID,
    seatCount: clampSeatCount(opts?.seatCount ?? DEFAULT_SEAT_COUNT),
    shape: opts?.shape ?? 'oval',
  };
  return { ...state, tables: [...state.tables, table] };
}

export function setTablePaletteInState(
  state: EventState,
  tableId: string,
  paletteId: TablePaletteId,
): EventState {
  return {
    ...state,
    tables: state.tables.map((t) => (t.id === tableId ? { ...t, paletteId } : t)),
  };
}

export function updateTableInState(
  state: EventState,
  tableId: string,
  patch: {
    seatCount?: number;
    shape?: TableShape;
    label?: string;
    paletteId?: TablePaletteId;
  },
): EventState {
  const table = state.tables.find((t) => t.id === tableId);
  if (!table) return state;

  const nextSeatCount =
    patch.seatCount !== undefined ? clampSeatCount(patch.seatCount) : table.seatCount;
  const nextShape = patch.shape ?? table.shape;
  const nextLabel = patch.label !== undefined ? patch.label.trim() || table.label : table.label;
  const nextPaletteId = patch.paletteId ?? table.paletteId;

  let assignments = state.assignments;
  if (nextSeatCount < table.seatCount) {
    assignments = { ...state.assignments };
    for (const g of state.guests) {
      const a = assignments[g.id];
      if (a && a.tableId === tableId && a.seatIndex >= nextSeatCount) {
        assignments[g.id] = null;
      }
    }
  }

  const tables = state.tables.map((t) =>
    t.id === tableId
      ? {
          ...t,
          seatCount: nextSeatCount,
          shape: nextShape,
          label: nextLabel,
          paletteId: nextPaletteId,
        }
      : t,
  );

  return { ...state, tables, assignments };
}

export function removeTableFromState(state: EventState, tableId: string): EventState {
  return {
    ...state,
    tables: state.tables.filter((t) => t.id !== tableId),
    assignments: Object.fromEntries(
      Object.entries(state.assignments).map(([gid, a]) => {
        if (a && a.tableId === tableId) return [gid, null];
        return [gid, a];
      }),
    ) as Record<string, SeatAssignment | null>,
  };
}
