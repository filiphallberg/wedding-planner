import { compareStringsNatural } from '../../../lib/compareStringsNatural';
import type { Table } from '../../../state/types';

export function sortTablesByLabel(tables: Table[]): Table[] {
  return [...tables].sort((a, b) => compareStringsNatural(a.label, b.label));
}
