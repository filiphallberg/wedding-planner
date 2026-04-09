import type { TableShape } from '../state/tableShape'

/**
 * Table accent palettes using Tailwind theme colors. Class names are written in full
 * so the build can statically detect them (dynamic `bg-${name}-100` would be purged).
 */
export const TABLE_PALETTES = {
  stone: {
    label: 'Stone',
    card: 'border-stone-200 bg-white',
    header: 'border-stone-100',
    title: 'text-stone-800',
    meta: 'text-xs text-stone-400',
    metaEmphasis: 'text-stone-500',
    body: 'bg-stone-50/40',
    ovalOuter:
      'rounded-[50%] border border-stone-300 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]',
    ovalInner:
      'pointer-events-none absolute inset-[12%] rounded-[50%] border border-stone-100/90',
    swatch: 'bg-stone-400',
  },
  rose: {
    label: 'Rose',
    card: 'border-rose-200 bg-white',
    header: 'border-rose-100',
    title: 'text-stone-800',
    meta: 'text-xs text-rose-600/75',
    metaEmphasis: 'text-rose-700',
    body: 'bg-rose-50/50',
    ovalOuter:
      'rounded-[50%] border border-rose-300 bg-rose-50/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]',
    ovalInner:
      'pointer-events-none absolute inset-[12%] rounded-[50%] border border-rose-200/80',
    swatch: 'bg-rose-500',
  },
  orange: {
    label: 'Orange',
    card: 'border-orange-200 bg-white',
    header: 'border-orange-100',
    title: 'text-stone-800',
    meta: 'text-xs text-orange-700/80',
    metaEmphasis: 'text-orange-800',
    body: 'bg-orange-50/50',
    ovalOuter:
      'rounded-[50%] border border-orange-300 bg-orange-50/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]',
    ovalInner:
      'pointer-events-none absolute inset-[12%] rounded-[50%] border border-orange-200/80',
    swatch: 'bg-orange-500',
  },
  amber: {
    label: 'Amber',
    card: 'border-amber-200 bg-white',
    header: 'border-amber-100',
    title: 'text-stone-800',
    meta: 'text-xs text-amber-800/75',
    metaEmphasis: 'text-amber-900',
    body: 'bg-amber-50/50',
    ovalOuter:
      'rounded-[50%] border border-amber-300 bg-amber-50/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]',
    ovalInner:
      'pointer-events-none absolute inset-[12%] rounded-[50%] border border-amber-200/80',
    swatch: 'bg-amber-500',
  },
  lime: {
    label: 'Lime',
    card: 'border-lime-200 bg-white',
    header: 'border-lime-100',
    title: 'text-stone-800',
    meta: 'text-xs text-lime-800/70',
    metaEmphasis: 'text-lime-900',
    body: 'bg-lime-50/50',
    ovalOuter:
      'rounded-[50%] border border-lime-300 bg-lime-50/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]',
    ovalInner:
      'pointer-events-none absolute inset-[12%] rounded-[50%] border border-lime-200/80',
    swatch: 'bg-lime-500',
  },
  emerald: {
    label: 'Emerald',
    card: 'border-emerald-200 bg-white',
    header: 'border-emerald-100',
    title: 'text-stone-800',
    meta: 'text-xs text-emerald-700/80',
    metaEmphasis: 'text-emerald-800',
    body: 'bg-emerald-50/50',
    ovalOuter:
      'rounded-[50%] border border-emerald-300 bg-emerald-50/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]',
    ovalInner:
      'pointer-events-none absolute inset-[12%] rounded-[50%] border border-emerald-200/80',
    swatch: 'bg-emerald-500',
  },
  teal: {
    label: 'Teal',
    card: 'border-teal-200 bg-white',
    header: 'border-teal-100',
    title: 'text-stone-800',
    meta: 'text-xs text-teal-700/80',
    metaEmphasis: 'text-teal-800',
    body: 'bg-teal-50/50',
    ovalOuter:
      'rounded-[50%] border border-teal-300 bg-teal-50/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]',
    ovalInner:
      'pointer-events-none absolute inset-[12%] rounded-[50%] border border-teal-200/80',
    swatch: 'bg-teal-500',
  },
  sky: {
    label: 'Sky',
    card: 'border-sky-200 bg-white',
    header: 'border-sky-100',
    title: 'text-stone-800',
    meta: 'text-xs text-sky-700/80',
    metaEmphasis: 'text-sky-800',
    body: 'bg-sky-50/50',
    ovalOuter:
      'rounded-[50%] border border-sky-300 bg-sky-50/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]',
    ovalInner:
      'pointer-events-none absolute inset-[12%] rounded-[50%] border border-sky-200/80',
    swatch: 'bg-sky-500',
  },
  blue: {
    label: 'Blue',
    card: 'border-blue-200 bg-white',
    header: 'border-blue-100',
    title: 'text-stone-800',
    meta: 'text-xs text-blue-700/80',
    metaEmphasis: 'text-blue-800',
    body: 'bg-blue-50/50',
    ovalOuter:
      'rounded-[50%] border border-blue-300 bg-blue-50/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]',
    ovalInner:
      'pointer-events-none absolute inset-[12%] rounded-[50%] border border-blue-200/80',
    swatch: 'bg-blue-500',
  },
  indigo: {
    label: 'Indigo',
    card: 'border-indigo-200 bg-white',
    header: 'border-indigo-100',
    title: 'text-stone-800',
    meta: 'text-xs text-indigo-700/80',
    metaEmphasis: 'text-indigo-800',
    body: 'bg-indigo-50/50',
    ovalOuter:
      'rounded-[50%] border border-indigo-300 bg-indigo-50/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]',
    ovalInner:
      'pointer-events-none absolute inset-[12%] rounded-[50%] border border-indigo-200/80',
    swatch: 'bg-indigo-500',
  },
  violet: {
    label: 'Violet',
    card: 'border-violet-200 bg-white',
    header: 'border-violet-100',
    title: 'text-stone-800',
    meta: 'text-xs text-violet-700/80',
    metaEmphasis: 'text-violet-800',
    body: 'bg-violet-50/50',
    ovalOuter:
      'rounded-[50%] border border-violet-300 bg-violet-50/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]',
    ovalInner:
      'pointer-events-none absolute inset-[12%] rounded-[50%] border border-violet-200/80',
    swatch: 'bg-violet-500',
  },
  fuchsia: {
    label: 'Fuchsia',
    card: 'border-fuchsia-200 bg-white',
    header: 'border-fuchsia-100',
    title: 'text-stone-800',
    meta: 'text-xs text-fuchsia-700/80',
    metaEmphasis: 'text-fuchsia-800',
    body: 'bg-fuchsia-50/50',
    ovalOuter:
      'rounded-[50%] border border-fuchsia-300 bg-fuchsia-50/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]',
    ovalInner:
      'pointer-events-none absolute inset-[12%] rounded-[50%] border border-fuchsia-200/80',
    swatch: 'bg-fuchsia-500',
  },
} as const

export type TablePaletteId = keyof typeof TABLE_PALETTES

export const DEFAULT_TABLE_PALETTE_ID: TablePaletteId = 'stone'

/** Dropdown order: neutral first, then hue progression. */
const TABLE_PALETTE_ORDER: TablePaletteId[] = [
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
]

export const TABLE_PALETTE_OPTIONS: { id: TablePaletteId; label: string }[] =
  TABLE_PALETTE_ORDER.map((id) => ({ id, label: TABLE_PALETTES[id].label }))

export function isTablePaletteId(value: string): value is TablePaletteId {
  return value in TABLE_PALETTES
}

export function getTablePalette(id: TablePaletteId) {
  return TABLE_PALETTES[id]
}

/** Aspect and border radii for the table surface inside the card. */
export function getTableShapeShell(
  shape: TableShape,
  palette: (typeof TABLE_PALETTES)[TablePaletteId],
): { aspect: string; outer: string; inner: string } {
  const outerRound =
    shape === 'oval' ? 'rounded-[50%]' : shape === 'round' ? 'rounded-full' : 'rounded-2xl'
  const innerRound =
    shape === 'oval' ? 'rounded-[50%]' : shape === 'round' ? 'rounded-full' : 'rounded-xl'
  return {
    aspect: shape === 'round' || shape === 'square' ? 'aspect-square' : 'aspect-[7/5]',
    outer: palette.ovalOuter.replaceAll('rounded-[50%]', outerRound),
    inner: palette.ovalInner.replaceAll('rounded-[50%]', innerRound),
  }
}
