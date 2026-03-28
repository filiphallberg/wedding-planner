import { useMemo } from 'react'
import { SeatSlot } from './SeatSlot'
import {
  getTablePalette,
  isTablePaletteId,
  TABLE_PALETTE_OPTIONS,
  type TablePaletteId,
} from '../lib/tablePalettes'
import { SEATS_PER_TABLE } from '../state/constants'
import type { Guest } from '../state/types'

type Props = {
  tableId: string
  label: string
  paletteId: TablePaletteId
  onPaletteChange: (paletteId: TablePaletteId) => void
  seats: (Guest | null)[]
  occupancy: number
  onUnseatGuest: (id: string) => void
  onRemoveTable: () => void
  onEditGuest: (guest: Guest) => void
}

export function TableCard({
  tableId,
  label,
  paletteId,
  onPaletteChange,
  seats,
  occupancy,
  onUnseatGuest,
  onRemoveTable,
  onEditGuest,
}: Props) {
  const full = occupancy >= SEATS_PER_TABLE
  const palette = getTablePalette(paletteId)

  const seatIndices = useMemo(
    () => Array.from({ length: SEATS_PER_TABLE }, (_, i) => i),
    [],
  )

  return (
    <article className={`flex flex-col rounded-lg border ${palette.card}`}>
      <header
        className={`flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2 ${palette.header}`}
      >
        <div className="min-w-0">
          <h3 className={`text-sm font-medium ${palette.title}`}>{label}</h3>
          <p className={palette.meta}>
            {occupancy}/{SEATS_PER_TABLE}
            {full ? (
              <span className={`ml-1 ${palette.metaEmphasis}`}>· Full</span>
            ) : null}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <div
            className="relative size-4 shrink-0 rounded-full shadow-sm ring-1 ring-black/10 focus-within:ring-2 focus-within:ring-stone-400 focus-within:ring-offset-2 focus-within:ring-offset-white"
            title={`${palette.label} — click to change table color`}
          >
            <div
              className={`pointer-events-none absolute inset-0 rounded-full ${palette.swatch}`}
              aria-hidden
            />
            <select
              value={paletteId}
              onChange={(e) => {
                const v = e.target.value
                if (isTablePaletteId(v)) onPaletteChange(v)
              }}
              className="absolute inset-0 cursor-pointer appearance-none rounded-full opacity-0"
              aria-label={`Table color for ${label}, ${palette.label}. Open to choose another palette.`}
            >
              {TABLE_PALETTE_OPTIONS.map(({ id, label: optLabel }) => (
                <option key={id} value={id}>
                  {optLabel}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={onRemoveTable}
            className="self-end rounded px-1.5 text-xs text-stone-400 hover:bg-stone-100 hover:text-stone-600 sm:self-center"
            aria-label={`Remove ${label}`}
          >
            Remove
          </button>
        </div>
      </header>

      <div className={`p-5 sm:p-6 ${palette.body}`}>
        <div className="relative mx-auto aspect-[7/5] w-full max-w-[min(100%,440px)]">
          <div className={`absolute inset-0 ${palette.ovalOuter}`} aria-hidden />
          <div className={palette.ovalInner} aria-hidden />

          {seatIndices.map((i) => (
            <SeatSlot
              key={i}
              tableId={tableId}
              seatIndex={i}
              guest={seats[i] ?? null}
              onUnseatGuest={onUnseatGuest}
              onEditGuest={onEditGuest}
            />
          ))}
        </div>
      </div>
    </article>
  )
}
