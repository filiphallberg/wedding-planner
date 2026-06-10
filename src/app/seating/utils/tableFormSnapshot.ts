import { DEFAULT_TABLE_PALETTE_ID } from '../../../lib/tablePalettes';
import { DEFAULT_SEAT_COUNT } from '../../../state/constants';
import type { TableShape } from '../../../state/tableShape';
import type { Table } from '../../../state/types';
import type { TableEditorState } from '../types';

export type TableFormSnapshot = {
  label: string;
  seatCount: number;
  shape: TableShape;
  paletteId: Table['paletteId'];
};

export function buildTableFormSnapshot(
  tableEditor: TableEditorState,
  tables: Table[],
): TableFormSnapshot | null {
  if (!tableEditor) return null;
  if (tableEditor.mode === 'add') {
    return {
      label: '',
      seatCount: DEFAULT_SEAT_COUNT,
      shape: 'oval',
      paletteId: DEFAULT_TABLE_PALETTE_ID,
    };
  }
  const table = tables.find((t) => t.id === tableEditor.tableId);
  if (!table) return null;
  return {
    label: table.label,
    seatCount: table.seatCount,
    shape: table.shape,
    paletteId: table.paletteId,
  };
}
