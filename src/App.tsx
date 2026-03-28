import { useMemo, useRef, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { weddingCollisionDetection } from './collisionDetection'
import { GuestChipBody } from './components/GuestChip'
import { GuestEditModal } from './components/GuestEditModal'
import { TableCard } from './components/TableCard'
import { UnassignedPool } from './components/UnassignedPool'
import { downloadConfigJson } from './export/configJson'
import { compareStringsNatural } from './lib/compareStringsNatural'
import { parseWeddingState } from './state/storage'
import type { Guest } from './state/types'
import { useWeddingState } from './state/useWeddingState'

export default function App() {
  const {
    addGuest,
    updateGuest,
    removeGuest,
    unseatGuest,
    addTable,
    setTablePalette,
    removeTable,
    handleDragEnd,
    unassignedGuests,
    seatsForTable,
    tableOccupancy,
    state,
    replaceState,
  } = useWeddingState()

  const importFileRef = useRef<HTMLInputElement>(null)

  const [guestName, setGuestName] = useState('')
  const [newGuestNeedsNote, setNewGuestNeedsNote] = useState('')
  const [tableLabel, setTableLabel] = useState('')
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null)
  const [activeDragGuest, setActiveDragGuest] = useState<{
    guest: Guest
    compact: boolean
  } | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  )

  const sortedTables = useMemo(
    () => [...state.tables].sort((a, b) => compareStringsNatural(a.label, b.label)),
    [state.tables],
  )

  const onDragStart = (event: DragStartEvent) => {
    const guestId = String(event.active.id)
    const guest = state.guests.find((g) => g.id === guestId)
    if (!guest) {
      setActiveDragGuest(null)
      return
    }
    const compact = Boolean(event.active.data.current?.compact)
    setActiveDragGuest({ guest, compact })
  }

  const onDragEnd = (event: DragEndEvent) => {
    setActiveDragGuest(null)
    handleDragEnd(event)
  }

  const onDragCancel = () => {
    setActiveDragGuest(null)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={weddingCollisionDetection}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
    >
      <div className="flex min-h-svh w-full max-w-full flex-col">
        <header className="shrink-0 border-b border-stone-200 px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-medium tracking-tight text-stone-900">Seating</h1>
                <button
                  type="button"
                  onClick={async () => {
                    const { downloadSeatingPdf } = await import('./export/seatingPdf')
                    downloadSeatingPdf(state)
                  }}
                  className="rounded-md border border-stone-300 bg-white px-2.5 py-1 text-xs text-stone-600 hover:bg-stone-50"
                >
                  Export PDF
                </button>
                <button
                  type="button"
                  onClick={() => downloadConfigJson(state)}
                  className="rounded-md border border-stone-300 bg-white px-2.5 py-1 text-xs text-stone-600 hover:bg-stone-50"
                >
                  Export JSON
                </button>
                <input
                  ref={importFileRef}
                  id="import-wedding-config"
                  type="file"
                  accept="application/json,.json"
                  className="sr-only"
                  tabIndex={-1}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const reader = new FileReader()
                    reader.onload = () => {
                      try {
                        const text = reader.result as string
                        const parsed: unknown = JSON.parse(text)
                        const next = parseWeddingState(parsed)
                        if (!next) {
                          window.alert(
                            'Invalid config file. Use a JSON export from this app, or a compatible v1–v3 backup.',
                          )
                          return
                        }
                        replaceState(next)
                      } catch {
                        window.alert('Could not parse JSON.')
                      } finally {
                        e.target.value = ''
                      }
                    }
                    reader.onerror = () => {
                      window.alert('Could not read the file.')
                      e.target.value = ''
                    }
                    reader.readAsText(file)
                  }}
                />
                <button
                  type="button"
                  onClick={() => importFileRef.current?.click()}
                  className="rounded-md border border-stone-300 bg-white px-2.5 py-1 text-xs text-stone-600 hover:bg-stone-50"
                  aria-label="Import configuration from a JSON file"
                >
                  Import JSON
                </button>
              </div>
              <p className="mt-1 max-w-3xl text-sm text-stone-500">
                Each table has nine seats around the oval. Drag into a seat to place someone, or onto
                another guest to swap. Drag back to the unassigned lane on the left to unseat, or use
                × on a seated guest. × in the unassigned list removes the guest entirely.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <form
                className="flex flex-col gap-2 sm:flex-row sm:items-end"
                onSubmit={(e) => {
                  e.preventDefault()
                  addGuest(guestName, newGuestNeedsNote)
                  setGuestName('')
                  setNewGuestNeedsNote('')
                }}
              >
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Guest name"
                    className="min-w-[10rem] rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-sm text-stone-800 placeholder:text-stone-400 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
                  />
                  <textarea
                    value={newGuestNeedsNote}
                    onChange={(e) => setNewGuestNeedsNote(e.target.value)}
                    placeholder="Dietary / special needs (optional)"
                    rows={2}
                    className="min-w-[12rem] resize-y rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-xs text-stone-800 placeholder:text-stone-400 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50"
                >
                  Add guest
                </button>
              </form>
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  addTable(tableLabel)
                  setTableLabel('')
                }}
              >
                <input
                  type="text"
                  value={tableLabel}
                  onChange={(e) => setTableLabel(e.target.value)}
                  placeholder="Table name"
                  className="min-w-[10rem] rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-sm text-stone-800 placeholder:text-stone-400 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
                />
                <button
                  type="submit"
                  className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50"
                >
                  Add table
                </button>
              </form>
            </div>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
          <aside className="flex min-h-0 w-full shrink-0 flex-col border-b border-stone-200 bg-stone-50/70 px-4 py-6 sm:w-80 sm:max-w-[20rem] sm:border-b-0 sm:border-r sm:px-5 lg:px-6">
            <UnassignedPool
              guests={unassignedGuests}
              onRemoveGuest={removeGuest}
              onEditGuest={setEditingGuest}
            />
          </aside>

          <main className="min-w-0 flex-1 px-4 py-6 sm:px-5 lg:px-6">
            <section className="space-y-3">
              <h2 className="text-sm font-medium tracking-tight text-stone-600">Tables ({sortedTables.length})</h2>
              {sortedTables.length === 0 ? (
                <p className="text-sm text-stone-400">No tables yet.</p>
              ) : (
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
                  {sortedTables.map((t) => (
                    <TableCard
                      key={t.id}
                      tableId={t.id}
                      label={t.label}
                      paletteId={t.paletteId}
                      onPaletteChange={(paletteId) => setTablePalette(t.id, paletteId)}
                      seats={seatsForTable(t.id)}
                      occupancy={tableOccupancy(t.id)}
                      onUnseatGuest={unseatGuest}
                      onRemoveTable={() => removeTable(t.id)}
                      onEditGuest={setEditingGuest}
                    />
                  ))}
                </div>
              )}
            </section>
          </main>
        </div>
      </div>

      <DragOverlay zIndex={200}>
        {activeDragGuest ? (
          <GuestChipBody
            name={activeDragGuest.guest.name}
            specialNeedsNote={activeDragGuest.guest.specialNeedsNote}
            compact={activeDragGuest.compact}
            showActions={false}
            className="cursor-grabbing shadow-lg ring-2 ring-stone-300/70"
          />
        ) : null}
      </DragOverlay>

      {editingGuest && (
        <GuestEditModal
          key={editingGuest.id}
          guest={editingGuest}
          onClose={() => setEditingGuest(null)}
          onSave={(guestId, patch) => {
            updateGuest(guestId, { name: patch.name, specialNeedsNote: patch.specialNeedsNote })
          }}
        />
      )}
    </DndContext>
  )
}
