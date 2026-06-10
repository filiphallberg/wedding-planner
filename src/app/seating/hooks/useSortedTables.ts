import { useMemo } from 'react';
import type { Table } from '../../../state/types';
import { sortTablesByLabel } from '../utils/sortTables';

export function useSortedTables(tables: Table[]) {
  return useMemo(() => sortTablesByLabel(tables), [tables]);
}
