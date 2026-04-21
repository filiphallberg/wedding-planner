import {
  DndContext,
  type DragEndEvent,
  type DragMoveEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { eventCollisionDetection } from '../collisionDetection';
import { AddGuestDialog } from '../components/AddGuestDialog';
import { GuestChipBody } from '../components/GuestChip';
import { GuestEditModal } from '../components/GuestEditModal';
import { TableCard } from '../components/TableCard';
import { TableFormDialog } from '../components/TableFormDialog';
import { UnassignedPool } from '../components/UnassignedPool';
import { compareStringsNatural } from '../lib/compareStringsNatural';
import { DEFAULT_TABLE_PALETTE_ID } from '../lib/tablePalettes';
import { DEFAULT_SEAT_COUNT } from '../state/constants';
import type { TableShape } from '../state/tableShape';
import type { Guest } from '../state/types';
import type { LayoutEvent } from '../state/useEventState';
import { Button, MenuDisclosure, MenuRow, MenuSectionTitle } from '../ui';
import { cn } from '../utils';

export type { LayoutEvent };

/** Shared horizontal + vertical padding for sidebar and tables so columns align. */
const workspacePad = 'px-4 py-5 sm:px-6';

export type ProjectControls = {
  projectId: string | null;
  projects: { id: string; name: string; role?: 'owner' | 'member' }[];
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
  onRenameProject: () => void;
  canRenameProject?: boolean;
  onOpenInvite?: () => void;
};

export function SeatingLayout({
  projectControls,
  userSlot,
  eventState,
}: {
  projectControls: ProjectControls;
  userSlot: ReactNode;
  eventState: LayoutEvent;
}) {
  const {
    projectId,
    projects,
    onSelectProject,
    onNewProject,
    onRenameProject,
    canRenameProject = true,
    onOpenInvite,
  } = projectControls;

  const {
    addGuest,
    updateGuest,
    removeGuest,
    unseatGuest,
    addTable,
    updateTable,
    removeTable,
    handleDragEnd,
    unassignedGuests,
    seatsForTable,
    tableOccupancy,
    state,
    hydrated,
  } = eventState;

  const [addGuestOpen, setAddGuestOpen] = useState(false);
  const [tableEditor, setTableEditor] = useState<
    null | { mode: 'add' } | { mode: 'edit'; tableId: string }
  >(null);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [guestLandKeys, setGuestLandKeys] = useState<Record<string, number>>({});
  const [activeDragGuest, setActiveDragGuest] = useState<{
    guest: Guest;
    compact: boolean;
  } | null>(null);
  const [dragPointer, setDragPointer] = useState<{ x: number; y: number } | null>(null);
  const mainScrollRef = useRef<HTMLElement | null>(null);

  const landKeyForGuestId = useCallback(
    (guestId: string) => guestLandKeys[guestId] ?? 0,
    [guestLandKeys],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const sortedTables = useMemo(
    () => [...state.tables].sort((a, b) => compareStringsNatural(a.label, b.label)),
    [state.tables],
  );

  const activeProject = useMemo(
    () => projects.find((p) => p.id === projectId),
    [projects, projectId],
  );

  const projectMenuLabel = activeProject
    ? `${activeProject.name}${activeProject.role === 'member' ? ' (shared)' : ''}`
    : 'Project';

  const tableFormSnapshot = useMemo(() => {
    if (!tableEditor) return null;
    if (tableEditor.mode === 'add') {
      return {
        label: '',
        seatCount: DEFAULT_SEAT_COUNT,
        shape: 'oval' as TableShape,
        paletteId: DEFAULT_TABLE_PALETTE_ID,
      };
    }
    const t = state.tables.find((x) => x.id === tableEditor.tableId);
    if (!t) return null;
    return {
      label: t.label,
      seatCount: t.seatCount,
      shape: t.shape,
      paletteId: t.paletteId,
    };
  }, [tableEditor, state.tables]);

  useEffect(() => {
    if (!tableEditor) return;
    if (!tableFormSnapshot) setTableEditor(null);
  }, [tableEditor, tableFormSnapshot]);

  const onDragStart = (event: DragStartEvent) => {
    const guestId = String(event.active.id);
    const guest = state.guests.find((g) => g.id === guestId);
    if (!guest) {
      setActiveDragGuest(null);
      return;
    }
    const compact = Boolean(event.active.data.current?.compact);
    setActiveDragGuest({ guest, compact });
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveDragGuest(null);
    setDragPointer(null);
    const flashes = handleDragEnd(event);
    if (flashes.length === 0) return;
    setGuestLandKeys((prev) => {
      const next = { ...prev };
      for (const id of flashes) {
        next[id] = (next[id] ?? 0) + 1;
      }
      return next;
    });
  };

  const onDragCancel = () => {
    setActiveDragGuest(null);
    setDragPointer(null);
  };

  const onDragMove = (event: DragMoveEvent) => {
    const rect = event.active.rect.current.translated;
    if (!rect) return;
    setDragPointer({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
  };

  useEffect(() => {
    if (!activeDragGuest || !dragPointer) return;
    const EDGE_PX = 84;
    const MAX_STEP_PX = 18;

    const speedForEdge = (distance: number): number => {
      if (distance >= EDGE_PX) return 0;
      const ratio = (EDGE_PX - distance) / EDGE_PX;
      return Math.max(2, Math.round(ratio * MAX_STEP_PX));
    };

    let raf = 0;
    const tick = () => {
      const el = mainScrollRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const topDist = Math.max(0, dragPointer.y - rect.top);
        const bottomDist = Math.max(0, rect.bottom - dragPointer.y);
        const leftDist = Math.max(0, dragPointer.x - rect.left);
        const rightDist = Math.max(0, rect.right - dragPointer.x);

        const up = speedForEdge(topDist);
        const down = speedForEdge(bottomDist);
        const left = speedForEdge(leftDist);
        const right = speedForEdge(rightDist);

        if (up > 0) el.scrollTop -= up;
        if (down > 0) el.scrollTop += down;
        if (left > 0) el.scrollLeft -= left;
        if (right > 0) el.scrollLeft += right;
      }
      raf = window.requestAnimationFrame(tick);
    };

    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [activeDragGuest, dragPointer]);

  if (!hydrated && projectId) {
    return (
      <div className="flex min-h-svh items-center justify-center text-stone-600">Loading plan…</div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={eventCollisionDetection}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
    >
      <div className="flex h-svh max-h-svh w-full max-w-full flex-col overflow-hidden bg-stone-50">
        <header className="shrink-0 border-b border-stone-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex gap-3 items-center justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <MenuDisclosure
                label={projectMenuLabel}
                align="start"
                summaryClassName="max-w-[min(100%,18rem)]"
              >
                <MenuSectionTitle>Projects</MenuSectionTitle>
                {projects.map((p) => {
                  const active = p.id === projectId;
                  return (
                    <div
                      key={p.id}
                      className={cn(
                        'flex w-full items-center gap-0.5 rounded-md p-0.5',
                        active ? 'bg-stone-100' : 'hover:bg-stone-50',
                      )}
                    >
                      <button
                        type="button"
                        className={cn(
                          'min-w-0 flex-1 cursor-pointer rounded-md px-2.5 py-2 text-left text-sm transition-colors',
                          active ? 'font-medium text-stone-900' : 'text-stone-800',
                        )}
                        onClick={(e) => {
                          onSelectProject(p.id);
                          (
                            e.currentTarget.closest('details') as HTMLDetailsElement | null
                          )?.removeAttribute('open');
                        }}
                      >
                        <span className="truncate">
                          {p.name}
                          {p.role === 'member' ? ' (shared)' : ''}
                        </span>
                      </button>
                      {canRenameProject && active ? (
                        <button
                          type="button"
                          className="shrink-0 cursor-pointer rounded-md px-2 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-200/90"
                          onClick={(e) => {
                            onRenameProject();
                            (
                              e.currentTarget.closest('details') as HTMLDetailsElement | null
                            )?.removeAttribute('open');
                          }}
                        >
                          Rename
                        </button>
                      ) : null}
                    </div>
                  );
                })}
                <MenuRow
                  onClick={onNewProject}
                  className="text-stone-600 opacity-70 hover:bg-stone-50 hover:opacity-100"
                >
                  <Plus className="mr-2 size-4 shrink-0 opacity-90" aria-hidden strokeWidth={2} />
                  New project
                </MenuRow>
              </MenuDisclosure>
              {onOpenInvite ? (
                <Button className="h-full" type="button" variant="secondary" onClick={onOpenInvite}>
                  Invite
                </Button>
              ) : null}
              <Button
                type="button"
                variant="secondary"
                className="h-full"
                onClick={async () => {
                  const { downloadSeatingPdf } = await import('../export/seatingPdf');
                  downloadSeatingPdf(state);
                }}
              >
                Export PDF
              </Button>
            </div>
            <div className="flex shrink-0 items-center sm:justify-end">{userSlot}</div>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
          <aside
            className={`flex min-h-0 w-full shrink-0 flex-col overflow-hidden border-b border-stone-200 bg-white max-h-[40svh] lg:max-h-none lg:h-full lg:w-72 lg:border-b-0 lg:border-r lg:border-stone-200 ${workspacePad}`}
          >
            <UnassignedPool
              guests={unassignedGuests}
              onRemoveGuest={removeGuest}
              onEditGuest={setEditingGuest}
              landKeyForGuestId={landKeyForGuestId}
              onAddGuest={() => setAddGuestOpen(true)}
            />
          </aside>

          <main
            ref={mainScrollRef}
            className={`min-h-0 flex-1 overflow-y-auto overscroll-contain bg-stone-50 ${workspacePad}`}
          >
            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-medium tracking-tight text-stone-600">
                  Tables ({sortedTables.length})
                </h2>
                <Button
                  type="button"
                  variant="secondary"
                  className="shrink-0 text-xs"
                  onClick={() => setTableEditor({ mode: 'add' })}
                >
                  Add table
                </Button>
              </div>
              {sortedTables.length === 0 ? (
                <p className="text-sm text-stone-500">No tables yet.</p>
              ) : (
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
                  {sortedTables.map((t) => (
                    <TableCard
                      key={t.id}
                      tableId={t.id}
                      label={t.label}
                      paletteId={t.paletteId}
                      seatCount={t.seatCount}
                      shape={t.shape}
                      seats={seatsForTable(t.id)}
                      occupancy={tableOccupancy(t.id)}
                      onUnseatGuest={unseatGuest}
                      onEditGuest={setEditingGuest}
                      landKeyForGuestId={landKeyForGuestId}
                      onOpenTableSetup={() => setTableEditor({ mode: 'edit', tableId: t.id })}
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
            variant="dragOverlay"
            className="cursor-grabbing"
          />
        ) : null}
      </DragOverlay>

      <AddGuestDialog
        open={addGuestOpen}
        onClose={() => setAddGuestOpen(false)}
        onAdd={(name, note) => addGuest(name, note)}
      />
      <TableFormDialog
        open={tableEditor !== null && tableFormSnapshot !== null}
        onClose={() => setTableEditor(null)}
        editingTableId={tableEditor?.mode === 'edit' ? tableEditor.tableId : null}
        initial={tableFormSnapshot}
        onAdd={(s) =>
          addTable(s.label, {
            seatCount: s.seatCount,
            shape: s.shape,
            paletteId: s.paletteId,
          })
        }
        onUpdate={(id, s) =>
          updateTable(id, {
            label: s.label,
            seatCount: s.seatCount,
            shape: s.shape,
            paletteId: s.paletteId,
          })
        }
        onRemove={removeTable}
      />

      {editingGuest && (
        <GuestEditModal
          key={editingGuest.id}
          guest={editingGuest}
          onClose={() => setEditingGuest(null)}
          onSave={(guestId, patch) => {
            updateGuest(guestId, {
              name: patch.name,
              specialNeedsNote: patch.specialNeedsNote,
            });
          }}
        />
      )}
    </DndContext>
  );
}
