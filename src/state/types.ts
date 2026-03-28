export type Guest = {
  id: string
  name: string
  /** Dietary restrictions, allergies, accessibility, etc. Empty string = none. */
  specialNeedsNote: string
}

import type { TablePaletteId } from '../lib/tablePalettes'

export type Table = {
  id: string
  label: string
  /** Accent colors for this card (Tailwind palette name). */
  paletteId: TablePaletteId
}

export type SeatAssignment = {
  tableId: string
  /** 0 .. SEATS_PER_TABLE - 1 */
  seatIndex: number
}

export type WeddingState = {
  version: 3
  guests: Guest[]
  tables: Table[]
  assignments: Record<string, SeatAssignment | null>
}
