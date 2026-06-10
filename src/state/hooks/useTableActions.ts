import { type Dispatch, type SetStateAction, useCallback } from 'react';
import type { TablePaletteId } from '../../lib/tablePalettes';
import type { TableShape } from '../tableShape';
import type { EventState } from '../types';
import {
  addTableToState,
  removeTableFromState,
  setTablePaletteInState,
  updateTableInState,
} from '../utils/tableMutations';

export function useTableActions(setState: Dispatch<SetStateAction<EventState>>) {
  const addTable = useCallback(
    (
      label: string,
      opts?: { seatCount?: number; shape?: TableShape; paletteId?: TablePaletteId },
    ) => {
      setState((s) => addTableToState(s, label, opts) ?? s);
    },
    [setState],
  );

  const setTablePalette = useCallback(
    (tableId: string, paletteId: TablePaletteId) => {
      setState((s) => setTablePaletteInState(s, tableId, paletteId));
    },
    [setState],
  );

  const updateTable = useCallback(
    (
      tableId: string,
      patch: {
        seatCount?: number;
        shape?: TableShape;
        label?: string;
        paletteId?: TablePaletteId;
      },
    ) => {
      setState((s) => updateTableInState(s, tableId, patch));
    },
    [setState],
  );

  const removeTable = useCallback(
    (tableId: string) => {
      setState((s) => removeTableFromState(s, tableId));
    },
    [setState],
  );

  return { addTable, setTablePalette, updateTable, removeTable };
}
