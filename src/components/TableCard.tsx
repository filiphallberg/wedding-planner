import { useMemo } from 'react'
import { SeatSlot } from './SeatSlot'
import {
  getTablePalette,
  getTableShapeShell,
  isTablePaletteId,
  TABLE_PALETTE_OPTIONS,
  type TablePaletteId,
} from '../lib/tablePalettes'
import { MAX_SEATS_PER_TABLE } from '../state/constants'
import { TABLE_SHAPES, type TableShape } from '../state/tableShape'
import type { Guest } from '../state/types'

const SHAPE_LABELS: Record<TableShape, string> = {
  oval: 'Oval',
  round: 'Round',
  square: 'Square',
  rectangle: 'Rectangle',
}

type Props = {
  tableId: string
  label: string
  paletteId: TablePaletteId
  seatCount: number
  shape: TableShape
  onPaletteChange: (paletteId: TablePaletteId) => void
  onTableLayoutChange: (patch: { seatCount?: number; shape?: TableShape }) => void
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
  seatCount,
  shape,
  onPaletteChange,
  onTableLayoutChange,
  seats,
  occupancy,
  onUnseatGuest,
  onRemoveTable,
  onEditGuest,
}: Props) {
  const full = occupancy >= seatCount
  const palette = getTablePalette(paletteId)
  const shell = getTableShapeShell(shape, palette)

  const seatIndices = useMemo(
    () => Array.from({ length: seatCount }, (_, i) => i),
    [seatCount],
  )

  return (
    <article className={`flex flex-col rounded-lg border ${palette.card}`}>
      <header
        className={`flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2 ${palette.header}`}
      >
        <div className="min-w-0">
          <h3 className={`text-sm font-medium ${palette.title}`}>{label}</h3>
          <p className={palette.meta}>
            {occupancy}/{seatCount}
            {full ? (
              <span className={`ml-1 ${palette.metaEmphasis}`}>· Full</span>
            ) : null}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          <label className="flex items-center gap-1.5 text-xs text-stone-600">
            <span className="sr-only">Seats for {label}</span>
            <span aria-hidden className="hidden sm:inline">
              Seats
            </span>
            <input
              type="number"
              min={1}
              max={MAX_SEATS_PER_TABLE}
              value={seatCount}
              onChange={(e) => {
                const v = Number.parseInt(e.target.value, 10)
                if (!Number.isFinite(v)) return
                onTableLayoutChange({ seatCount: v })
              }}
              className="w-14 rounded border border-stone-200 bg-white px-1.5 py-0.5 text-stone-800"
            />
          </label>
          <label className="flex items-center gap-1.5 text-xs text-stone-600">
            <span className="sr-only">Shape for {label}</span>
            <span aria-hidden className="hidden sm:inline">
              Shape
            </span>
            <select
              value={shape}
              onChange={(e) => {
                const v = e.target.value
                if ((TABLE_SHAPES as readonly string[]).includes(v)) {
                  onTableLayoutChange({ shape: v as TableShape })
                }
              }}
              className="max-w-[7.5rem] rounded border border-stone-200 bg-white px-1.5 py-0.5 text-stone-800"
            >
              {TABLE_SHAPES.map((id) => (
                <option key={id} value={id}>
                  {SHAPE_LABELS[id]}
                </option>
              ))}
            </select>
          </label>
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
        <div
          className={`relative mx-auto w-full max-w-[min(100%,440px)] ${shell.aspect}`}
        >
          <div className={`absolute inset-0 ${shell.outer}`} aria-hidden />
          <div className={shell.inner} aria-hidden />

          {seatIndices.map((i) => (
            <SeatSlot
              key={i}
              tableId={tableId}
              seatIndex={i}
              guest={seats[i] ?? null}
              shape={shape}
              seatCount={seatCount}
              onUnseatGuest={onUnseatGuest}
              onEditGuest={onEditGuest}
            />
          ))}
        </div>
      </div>
    </article>
  )
}
