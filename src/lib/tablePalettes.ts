/**
 * Palette IDs. Colors are defined in tailwind-variants via `tablePaletteVariants.ts`.
 */
export const TABLE_PALETTE_IDS = [
  'stone',
  'rose',
  'orange',
  'amber',
  'lime',
  'emerald',
  'teal',
  'sky',
  'blue',
  'indigo',
  'violet',
  'fuchsia',
] as const;

export type TablePaletteId = (typeof TABLE_PALETTE_IDS)[number];

export const DEFAULT_TABLE_PALETTE_ID: TablePaletteId = 'stone';

export const TABLE_PALETTE_LABELS: Record<TablePaletteId, string> = {
  stone: 'Stone',
  rose: 'Rose',
  orange: 'Orange',
  amber: 'Amber',
  lime: 'Lime',
  emerald: 'Emerald',
  teal: 'Teal',
  sky: 'Sky',
  blue: 'Blue',
  indigo: 'Indigo',
  violet: 'Violet',
  fuchsia: 'Fuchsia',
};

export const TABLE_PALETTE_OPTIONS: { id: TablePaletteId; label: string }[] = TABLE_PALETTE_IDS.map(
  (id) => ({ id, label: TABLE_PALETTE_LABELS[id] }),
);

export function isTablePaletteId(value: string): value is TablePaletteId {
  return TABLE_PALETTE_IDS.includes(value as TablePaletteId);
}
