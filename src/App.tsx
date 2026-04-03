import { useAuth, SignIn, UserButton } from '@clerk/clerk-react'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
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
import {
  createProjectApi,
  listProjectsApi,
  renameProjectApi,
  saveProjectApi,
  type ProjectMeta,
} from './sync/projectApi'
import { parseWeddingState } from './state/storage'
import type { Guest } from './state/types'
import { useWeddingState } from './state/useWeddingState'
import {
  createLocalProject,
  listLocalProjects,
  migrateLegacyLocalStorageIfNeeded,
  renameLocalProject,
} from './state/localProjectStorage'
const ACTIVE_PROJECT_KEY = 'wedding-seating-active-project'

function readStoredProjectId(): string | null {
  try {
    return sessionStorage.getItem(ACTIVE_PROJECT_KEY)
  } catch {
    return null
  }
}

function writeStoredProjectId(id: string | null): void {
  try {
    if (id) sessionStorage.setItem(ACTIVE_PROJECT_KEY, id)
    else sessionStorage.removeItem(ACTIVE_PROJECT_KEY)
  } catch {
    /* ignore */
  }
}

function LocalApp() {
  const [projects, setProjects] = useState<ProjectMeta[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => {
      migrateLegacyLocalStorageIfNeeded()
      let list = listLocalProjects().map((p) => ({ ...p }))
      if (list.length === 0) {
        const p = createLocalProject('Main')
        list = [{ id: p.id, name: p.name, updatedAt: p.updatedAt }]
      }
      setProjects(list)
      const stored = readStoredProjectId()
      const pick =
        stored && list.some((p) => p.id === stored) ? stored : list[0]!.id
      setActiveId(pick)
      setReady(true)
    }, 0)
    return () => window.clearTimeout(t)
  }, [])

  useEffect(() => {
    writeStoredProjectId(activeId)
  }, [activeId])

  const wedding = useWeddingState({ projectId: activeId, sync: 'local' })

  if (!ready || !activeId) {
    return (
      <div className="flex min-h-svh items-center justify-center text-stone-600">Loading…</div>
    )
  }

  const onNewProject = () => {
    const name = window.prompt('Project name', 'Untitled')
    if (name === null) return
    const p = createLocalProject(name || 'Untitled')
    setProjects(listLocalProjects().map((x) => ({ ...x })))
    setActiveId(p.id)
  }

  const onRename = async () => {
    if (!activeId) return
    const cur = projects.find((p) => p.id === activeId)
    const name = window.prompt('Project name', cur?.name ?? '')
    if (name === null) return
    renameLocalProject(activeId, name || 'Untitled')
    setProjects(listLocalProjects().map((p) => ({ ...p })))
  }

  return (
    <SeatingLayout
      projectId={activeId}
      projects={projects}
      onSelectProject={setActiveId}
      onNewProject={onNewProject}
      onRenameProject={onRename}
      userSlot={<span className="text-xs text-stone-500">Local mode (no Clerk)</span>}
      wedding={wedding}
    />
  )
}

function CloudApp() {
  const { isLoaded, isSignedIn } = useAuth()
  const [projects, setProjects] = useState<ProjectMeta[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [projectsLoading, setProjectsLoading] = useState(true)

  const bootstrap = useCallback(async () => {
    setProjectsLoading(true)
    try {
      let list = await listProjectsApi()
      if (list.length === 0) {
        const p = await createProjectApi('Main')
        list = [p]
      }
      setProjects(list)
      const stored = readStoredProjectId()
      const pick =
        stored && list.some((x) => x.id === stored) ? stored : list[0]!.id
      setActiveId(pick)
    } catch {
      setProjects([])
      setActiveId(null)
    } finally {
      setProjectsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return
    void bootstrap()
  }, [isLoaded, isSignedIn, bootstrap])

  useEffect(() => {
    writeStoredProjectId(activeId)
  }, [activeId])

  const wedding = useWeddingState({
    projectId: activeId,
    sync: 'cloud',
  })

  const onNewProject = async () => {
    const name = window.prompt('Project name', 'Untitled')
    if (name === null) return
    try {
      const p = await createProjectApi(name || 'Untitled')
      setProjects((prev) => [...prev, p])
      setActiveId(p.id)
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Could not create project')
    }
  }

  const onRename = async () => {
    if (!activeId) return
    const cur = projects.find((p) => p.id === activeId)
    const name = window.prompt('Project name', cur?.name ?? '')
    if (name === null) return
    try {
      const p = await renameProjectApi(activeId, name || 'Untitled')
      setProjects((prev) => prev.map((x) => (x.id === p.id ? p : x)))
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Could not rename')
    }
  }

  const importLocal = async () => {
    try {
      const raw = localStorage.getItem('wedding-seating-state')
      if (!raw) {
        window.alert('No legacy local data found (wedding-seating-state).')
        return
      }
      const parsed = parseWeddingState(JSON.parse(raw))
      if (!parsed) {
        window.alert('Invalid local data.')
        return
      }
      const p = await createProjectApi('Imported from browser')
      await saveProjectApi(p.id, parsed)
      await bootstrap()
      setActiveId(p.id)
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Import failed')
    }
  }

  if (!isLoaded || projectsLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center text-stone-600">Loading…</div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-stone-50 p-4">
        <SignIn routing="hash" />
      </div>
    )
  }

  return (
    <SeatingLayout
      projectId={activeId}
      projects={projects}
      onSelectProject={setActiveId}
      onNewProject={() => void onNewProject()}
      onRenameProject={() => void onRename()}
      onImportLocal={importLocal}
      userSlot={<UserButton afterSignOutUrl={window.location.href} />}
      wedding={wedding}
    />
  )
}

type LayoutWedding = ReturnType<typeof useWeddingState>

function SeatingLayout({
  projectId,
  projects,
  onSelectProject,
  onNewProject,
  onRenameProject,
  onImportLocal,
  userSlot,
  wedding,
}: {
  projectId: string | null
  projects: ProjectMeta[]
  onSelectProject: (id: string) => void
  onNewProject: () => void
  onRenameProject: () => void
  onImportLocal?: () => void
  userSlot: ReactNode
  wedding: LayoutWedding
}) {
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
    hydrated,
  } = wedding

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

  if (!hydrated && projectId) {
    return (
      <div className="flex min-h-svh items-center justify-center text-stone-600">Loading plan…</div>
    )
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
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-medium tracking-tight text-stone-900">Seating</h1>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="sr-only" htmlFor="project-select">
                    Active project
                  </label>
                  <select
                    id="project-select"
                    value={projectId ?? ''}
                    onChange={(e) => onSelectProject(e.target.value)}
                    className="max-w-[14rem] rounded-md border border-stone-200 bg-white px-2 py-1 text-sm text-stone-800"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={onNewProject}
                    className="rounded-md border border-stone-300 bg-white px-2.5 py-1 text-xs text-stone-600 hover:bg-stone-50"
                  >
                    New project
                  </button>
                  <button
                    type="button"
                    onClick={onRenameProject}
                    className="rounded-md border border-stone-300 bg-white px-2.5 py-1 text-xs text-stone-600 hover:bg-stone-50"
                  >
                    Rename
                  </button>
                  {onImportLocal ? (
                    <button
                      type="button"
                      onClick={onImportLocal}
                      className="rounded-md border border-stone-300 bg-white px-2.5 py-1 text-xs text-stone-600 hover:bg-stone-50"
                    >
                      Import legacy local
                    </button>
                  ) : null}
                </div>
                {userSlot}
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
              <h2 className="text-sm font-medium tracking-tight text-stone-600">
                Tables ({sortedTables.length})
              </h2>
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

export default function App() {
  const useClerk = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)
  if (useClerk) {
    return <CloudApp />
  }
  return <LocalApp />
}
