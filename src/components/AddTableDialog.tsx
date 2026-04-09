import { useEffect, useState } from 'react'
import { DEFAULT_SEAT_COUNT, MAX_SEATS_PER_TABLE } from '../state/constants'
import { TABLE_SHAPES, type TableShape } from '../state/tableShape'

const SHAPE_LABELS: Record<TableShape, string> = {
  oval: 'Oval',
  round: 'Round',
  square: 'Square',
  rectangle: 'Rectangle',
}

type Props = {
  open: boolean
  onClose: () => void
  onAdd: (label: string, options: { seatCount: number; shape: TableShape }) => void
}

export function AddTableDialog({ open, onClose, onAdd }: Props) {
  const [label, setLabel] = useState('')
  const [seatCount, setSeatCount] = useState(DEFAULT_SEAT_COUNT)
  const [shape, setShape] = useState<TableShape>('oval')

  useEffect(() => {
    if (!open) {
      setLabel('')
      setSeatCount(DEFAULT_SEAT_COUNT)
      setShape('oval')
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/20 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-table-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="w-full max-w-sm rounded-lg border border-stone-200 bg-white p-5 shadow-lg"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 id="add-table-title" className="text-base font-medium text-stone-900">
          Add table
        </h2>
        <form
          className="mt-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            const trimmed = label.trim()
            if (!trimmed) return
            onAdd(trimmed, { seatCount, shape })
            onClose()
          }}
        >
          <div>
            <label htmlFor="add-table-label" className="block text-xs font-medium text-stone-600">
              Table name
            </label>
            <input
              id="add-table-label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Table name"
              className="mt-1 w-full rounded-md border border-stone-200 px-2.5 py-1.5 text-sm text-stone-800 placeholder:text-stone-400 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="add-table-seats" className="block text-xs font-medium text-stone-600">
                Seats
              </label>
              <input
                id="add-table-seats"
                type="number"
                min={1}
                max={MAX_SEATS_PER_TABLE}
                value={seatCount}
                onChange={(e) => {
                  const v = Number.parseInt(e.target.value, 10)
                  if (!Number.isFinite(v)) return
                  setSeatCount(v)
                }}
                className="mt-1 w-full rounded-md border border-stone-200 px-2.5 py-1.5 text-sm text-stone-800"
              />
            </div>
            <div>
              <label htmlFor="add-table-shape" className="block text-xs font-medium text-stone-600">
                Shape
              </label>
              <select
                id="add-table-shape"
                value={shape}
                onChange={(e) => {
                  const v = e.target.value
                  if ((TABLE_SHAPES as readonly string[]).includes(v)) {
                    setShape(v as TableShape)
                  }
                }}
                className="mt-1 w-full rounded-md border border-stone-200 px-2.5 py-1.5 text-sm text-stone-800"
              >
                {TABLE_SHAPES.map((id) => (
                  <option key={id} value={id}>
                    {SHAPE_LABELS[id]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-stone-200 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-800 hover:bg-stone-50"
            >
              Add table
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
