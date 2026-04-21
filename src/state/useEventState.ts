import type { DragEndEvent } from '@dnd-kit/core';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_TABLE_PALETTE_ID, type TablePaletteId } from '../lib/tablePalettes';
import { useRealtime } from '../realtime/client';
import { getProjectApi, saveProjectApi } from '../sync/projectApi';
import { DEFAULT_SEAT_COUNT, MAX_SEATS_PER_TABLE } from './constants';
import { emptyState, parseEventState } from './eventStateCodec';
import { loadLocalProjectState, saveLocalProjectState } from './localProjectStorage';
import type { TableShape } from './tableShape';
import type { EventState, Guest, SeatAssignment, Table } from './types';

const SAVE_DEBOUNCE_MS = 450;

type DragApplyResult = { next: EventState; flashGuestIds: string[] };

function applyEventDragEnd(prev: EventState, event: DragEndEvent): DragApplyResult | null {
  const { active, over } = event;
  if (!over) return null;

  const guestId = String(active.id);
  const overId = String(over.id);

  if (overId === droppableUnassigned()) {
    return {
      next: { ...prev, assignments: { ...prev.assignments, [guestId]: null } },
      flashGuestIds: [guestId],
    };
  }

  const seat = parseSeatDroppable(overId);
  if (!seat) return null;

  const { tableId, seatIndex } = seat;
  const table = prev.tables.find((t) => t.id === tableId);
  if (!table || seatIndex < 0 || seatIndex >= table.seatCount) return null;

  const occupantId = Object.entries(prev.assignments).find(
    ([gid, val]) =>
      gid !== guestId && val !== null && val.tableId === tableId && val.seatIndex === seatIndex,
  )?.[0];

  const a = { ...prev.assignments };
  let flashGuestIds: string[];
  if (occupantId) {
    const gA = a[guestId];
    const gB = a[occupantId];
    a[guestId] = gB;
    a[occupantId] = gA;
    flashGuestIds = [guestId, occupantId];
  } else {
    a[guestId] = { tableId, seatIndex };
    flashGuestIds = [guestId];
  }

  return { next: { ...prev, assignments: a }, flashGuestIds };
}

function newId(): string {
  return crypto.randomUUID();
}

export function droppableUnassigned(): string {
  return 'unassigned';
}

export function droppableSeat(tableId: string, seatIndex: number): string {
  return `seat:${tableId}:${seatIndex}`;
}

export function parseSeatDroppable(id: string): { tableId: string; seatIndex: number } | null {
  if (!id.startsWith('seat:')) return null;
  const rest = id.slice('seat:'.length);
  const lastColon = rest.lastIndexOf(':');
  if (lastColon === -1) return null;
  const tableId = rest.slice(0, lastColon);
  const seatIndex = Number.parseInt(rest.slice(lastColon + 1), 10);
  if (!Number.isFinite(seatIndex) || seatIndex < 0 || seatIndex >= MAX_SEATS_PER_TABLE) {
    return null;
  }
  return { tableId, seatIndex };
}

export type EventSyncMode = 'local' | 'cloud';

export function useEventState(opts: { projectId: string | null; sync: EventSyncMode }) {
  const { projectId, sync } = opts;

  const [state, setState] = useState<EventState>(() => emptyState());
  const [hydrated, setHydrated] = useState(sync === 'local');

  const skipSaveRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSentJsonRef = useRef<string | null>(null);

  const clearSaveTimer = () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
  };

  useEffect(() => {
    clearSaveTimer();
    skipSaveRef.current = true;
    setHydrated(false);

    if (!projectId) {
      setState(emptyState());
      setHydrated(true);
      lastSentJsonRef.current = null;
      return;
    }

    if (sync === 'local') {
      const loaded = loadLocalProjectState(projectId) ?? emptyState();
      setState(loaded);
      lastSentJsonRef.current = JSON.stringify(loaded);
      setHydrated(true);
      skipSaveRef.current = false;
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const { state: remote } = await getProjectApi(projectId);
        if (cancelled) return;
        setState(remote);
        lastSentJsonRef.current = JSON.stringify(remote);
      } catch {
        if (!cancelled) setState(emptyState());
      } finally {
        if (!cancelled) {
          setHydrated(true);
          // Skip the first autosave pass: scheduling a PUT of the loaded snapshot would debounce
          // and could fire *after* someone else saved, overwriting newer server state (collaborators
          // then never see the owner's changes). Real saves only run after user edits.
          skipSaveRef.current = true;
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projectId, sync]);

  useEffect(() => {
    if (sync !== 'local' || !projectId) return;
    saveLocalProjectState(projectId, state);
  }, [sync, projectId, state]);

  const scheduleCloudSave = useCallback(
    (next: EventState) => {
      if (sync !== 'cloud' || !projectId) return;
      const json = JSON.stringify(next);
      if (json === lastSentJsonRef.current) return;
      clearSaveTimer();
      saveTimerRef.current = setTimeout(() => {
        saveTimerRef.current = null;
        void (async () => {
          try {
            await saveProjectApi(projectId, next);
            lastSentJsonRef.current = json;
          } catch {
            /* retry on next edit */
          }
        })();
      }, SAVE_DEBOUNCE_MS);
    },
    [sync, projectId],
  );

  useRealtime({
    channels: projectId && sync === 'cloud' ? [`project:${projectId}`] : [],
    enabled: Boolean(projectId && sync === 'cloud' && hydrated),
    onData: (payload) => {
      const data = payload.data as { stateJson?: string };
      const stateJson = data?.stateJson;
      if (typeof stateJson !== 'string') return;
      const parsed = parseEventState(JSON.parse(stateJson));
      if (!parsed) return;
      const incoming = JSON.stringify(parsed);
      if (incoming === lastSentJsonRef.current) return;
      skipSaveRef.current = true;
      lastSentJsonRef.current = incoming;
      setState(parsed);
    },
  });

  useEffect(() => {
    if (!hydrated || sync !== 'cloud' || !projectId) return;
    if (skipSaveRef.current) {
      skipSaveRef.current = false;
      return;
    }
    scheduleCloudSave(state);
    return () => clearSaveTimer();
  }, [state, hydrated, sync, projectId, scheduleCloudSave]);

  /** If SSE misses an update, refresh when the tab is foregrounded (no local edits pending). */
  useEffect(() => {
    if (sync !== 'cloud' || !projectId || !hydrated) return;
    const onVis = () => {
      if (document.visibilityState !== 'visible') return;
      if (saveTimerRef.current !== null) return;
      void (async () => {
        try {
          const { state: remote } = await getProjectApi(projectId);
          const incoming = JSON.stringify(remote);
          setState((prev) => {
            if (JSON.stringify(prev) !== lastSentJsonRef.current) return prev;
            if (incoming === lastSentJsonRef.current) return prev;
            lastSentJsonRef.current = incoming;
            skipSaveRef.current = true;
            return remote;
          });
        } catch {
          /* ignore */
        }
      })();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [sync, projectId, hydrated]);

  const addGuest = useCallback((name: string, specialNeedsNote = '') => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const guest: Guest = {
      id: newId(),
      name: trimmed,
      specialNeedsNote: specialNeedsNote.trim(),
    };
    setState((s) => ({
      ...s,
      guests: [...s.guests, guest],
      assignments: { ...s.assignments, [guest.id]: null },
    }));
  }, []);

  const updateGuest = useCallback(
    (guestId: string, patch: { name?: string; specialNeedsNote?: string }) => {
      setState((s) => ({
        ...s,
        guests: s.guests.map((g) => {
          if (g.id !== guestId) return g;
          const next = { ...g };
          if (patch.name !== undefined) {
            const trimmed = patch.name.trim();
            if (trimmed) next.name = trimmed;
          }
          if (patch.specialNeedsNote !== undefined) {
            next.specialNeedsNote = patch.specialNeedsNote.trim();
          }
          return next;
        }),
      }));
    },
    [],
  );

  const removeGuest = useCallback((guestId: string) => {
    setState((s) => {
      const restAssignments = { ...s.assignments };
      delete restAssignments[guestId];
      return {
        ...s,
        guests: s.guests.filter((g) => g.id !== guestId),
        assignments: restAssignments,
      };
    });
  }, []);

  const unseatGuest = useCallback((guestId: string) => {
    setState((s) => ({
      ...s,
      assignments: { ...s.assignments, [guestId]: null },
    }));
  }, []);

  const addTable = useCallback(
    (
      label: string,
      opts?: { seatCount?: number; shape?: TableShape; paletteId?: TablePaletteId },
    ) => {
      const trimmed = label.trim();
      if (!trimmed) return;
      let seatCount = opts?.seatCount ?? DEFAULT_SEAT_COUNT;
      seatCount = Math.round(seatCount);
      if (seatCount < 1) seatCount = 1;
      if (seatCount > MAX_SEATS_PER_TABLE) seatCount = MAX_SEATS_PER_TABLE;
      const table: Table = {
        id: newId(),
        label: trimmed,
        paletteId: opts?.paletteId ?? DEFAULT_TABLE_PALETTE_ID,
        seatCount,
        shape: opts?.shape ?? 'oval',
      };
      setState((s) => ({
        ...s,
        tables: [...s.tables, table],
      }));
    },
    [],
  );

  const setTablePalette = useCallback((tableId: string, paletteId: TablePaletteId) => {
    setState((s) => ({
      ...s,
      tables: s.tables.map((t) => (t.id === tableId ? { ...t, paletteId } : t)),
    }));
  }, []);

  const updateTable = useCallback(
    (
      tableId: string,
      patch: {
        seatCount?: number;
        shape?: TableShape;
        label?: string;
        paletteId?: TablePaletteId;
      },
    ) => {
      setState((s) => {
        const table = s.tables.find((t) => t.id === tableId);
        if (!table) return s;

        let nextSeatCount = table.seatCount;
        if (patch.seatCount !== undefined) {
          let n = Math.round(patch.seatCount);
          if (n < 1) n = 1;
          if (n > MAX_SEATS_PER_TABLE) n = MAX_SEATS_PER_TABLE;
          nextSeatCount = n;
        }

        const nextShape = patch.shape ?? table.shape;
        const nextLabel =
          patch.label !== undefined ? patch.label.trim() || table.label : table.label;
        const nextPaletteId = patch.paletteId ?? table.paletteId;

        let assignments = s.assignments;
        if (nextSeatCount < table.seatCount) {
          assignments = { ...s.assignments };
          for (const g of s.guests) {
            const a = assignments[g.id];
            if (a && a.tableId === tableId && a.seatIndex >= nextSeatCount) {
              assignments[g.id] = null;
            }
          }
        }

        const tables = s.tables.map((t) =>
          t.id === tableId
            ? {
                ...t,
                seatCount: nextSeatCount,
                shape: nextShape,
                label: nextLabel,
                paletteId: nextPaletteId,
              }
            : t,
        );

        return { ...s, tables, assignments };
      });
    },
    [],
  );

  const removeTable = useCallback((tableId: string) => {
    setState((s) => ({
      ...s,
      tables: s.tables.filter((t) => t.id !== tableId),
      assignments: Object.fromEntries(
        Object.entries(s.assignments).map(([gid, a]) => {
          if (a && a.tableId === tableId) return [gid, null];
          return [gid, a];
        }),
      ) as Record<string, SeatAssignment | null>,
    }));
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent): string[] => {
    let flashGuestIds: string[] = [];
    setState((prev) => {
      const applied = applyEventDragEnd(prev, event);
      if (!applied) return prev;
      flashGuestIds = applied.flashGuestIds;
      return applied.next;
    });
    return flashGuestIds;
  }, []);

  const unassignedGuests = useMemo(() => {
    return state.guests.filter((g) => state.assignments[g.id] == null);
  }, [state.guests, state.assignments]);

  const tableSeatMap = useMemo(() => {
    const tableById = new Map(state.tables.map((table) => [table.id, table]));
    const seatsByTable = new Map<string, (Guest | null)[]>();
    const guestById = new Map(state.guests.map((guest) => [guest.id, guest]));

    for (const table of state.tables) {
      seatsByTable.set(
        table.id,
        Array.from({ length: table.seatCount }, () => null),
      );
    }

    for (const [guestId, assignment] of Object.entries(state.assignments)) {
      if (!assignment) continue;
      const table = tableById.get(assignment.tableId);
      const guest = guestById.get(guestId);
      if (!table || !guest) continue;
      if (assignment.seatIndex < 0 || assignment.seatIndex >= table.seatCount) continue;
      seatsByTable.get(table.id)![assignment.seatIndex] = guest;
    }

    return seatsByTable;
  }, [state.tables, state.guests, state.assignments]);

  const tableOccupancyMap = useMemo(() => {
    const occupancyByTable = new Map<string, number>();
    for (const table of state.tables) {
      occupancyByTable.set(table.id, 0);
    }
    for (const assignment of Object.values(state.assignments)) {
      if (!assignment) continue;
      occupancyByTable.set(assignment.tableId, (occupancyByTable.get(assignment.tableId) ?? 0) + 1);
    }
    return occupancyByTable;
  }, [state.tables, state.assignments]);

  const seatsForTable = useCallback(
    (tableId: string): (Guest | null)[] => {
      const slots = tableSeatMap.get(tableId);
      if (slots) return slots;
      return Array.from({ length: DEFAULT_SEAT_COUNT }, () => null);
    },
    [tableSeatMap],
  );

  const tableOccupancy = useCallback(
    (tableId: string) => {
      return tableOccupancyMap.get(tableId) ?? 0;
    },
    [tableOccupancyMap],
  );

  const replaceState = useCallback((next: EventState) => {
    setState(next);
  }, []);

  return {
    state,
    hydrated,
    replaceState,
    addGuest,
    updateGuest,
    removeGuest,
    unseatGuest,
    addTable,
    setTablePalette,
    updateTable,
    removeTable,
    handleDragEnd,
    unassignedGuests,
    seatsForTable,
    tableOccupancy,
  };
}

export type LayoutEvent = ReturnType<typeof useEventState>;
