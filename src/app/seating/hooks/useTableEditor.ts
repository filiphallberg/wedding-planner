import { useEffect, useMemo, useState } from 'react';
import type { Table } from '../../../state/types';
import type { TableEditorState } from '../types';
import { buildTableFormSnapshot } from '../utils/tableFormSnapshot';

export function useTableEditor(tables: Table[]) {
  const [tableEditor, setTableEditor] = useState<TableEditorState>(null);

  const tableFormSnapshot = useMemo(
    () => buildTableFormSnapshot(tableEditor, tables),
    [tableEditor, tables],
  );

  useEffect(() => {
    if (!tableEditor) return;
    if (!tableFormSnapshot) setTableEditor(null);
  }, [tableEditor, tableFormSnapshot]);

  return {
    tableEditor,
    setTableEditor,
    tableFormSnapshot,
    openAddTable: () => setTableEditor({ mode: 'add' }),
    openEditTable: (tableId: string) => setTableEditor({ mode: 'edit', tableId }),
    closeTableEditor: () => setTableEditor(null),
  };
}
