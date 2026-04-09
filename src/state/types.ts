import type { TablePaletteId } from '../lib/tablePalettes'
import type { TableShape } from './tableShape'

export type { TableShape } from './tableShape'

export type Guest = {
  id: string
  name: string
  /** Dietary restrictions, allergies, accessibility, etc. Empty string = none. */
  specialNeedsNote: string
}

export type Table = {
  id: string
  label: string
  /** Accent colors for this card (Tailwind palette name). */
  paletteId: TablePaletteId
  /** Number of seats around the table (evenly spaced). */
  seatCount: number
  /** Visual outline of the table surface. */
  shape: TableShape
}

export type SeatAssignment = {
  tableId: string
  /** 0 .. table.seatCount - 1 for that table */
  seatIndex: number
}

export type WeddingState = {
  version: 3
  guests: Guest[]
  tables: Table[]
  assignments: Record<string, SeatAssignment | null>
}
