import { useCallback, useEffect, useMemo, useState } from 'react'
import type { DragEndEvent } from '@dnd-kit/core'
import { DEFAULT_TABLE_PALETTE_ID, type TablePaletteId } from '../lib/tablePalettes'
import { SEATS_PER_TABLE } from './constants'
import { emptyState, loadState, saveState } from './storage'
import type { Guest, SeatAssignment, Table, WeddingState } from './types'

function newId(): string {
  return crypto.randomUUID()
}

export function droppableUnassigned(): string {
  return 'unassigned'
}

/** Droppable id for a fixed seat slot (0 .. SEATS_PER_TABLE - 1). */
export function droppableSeat(tableId: string, seatIndex: number): string {
  return `seat:${tableId}:${seatIndex}`
}

export function parseSeatDroppable(id: string): { tableId: string; seatIndex: number } | null {
  if (!id.startsWith('seat:')) return null
  const rest = id.slice('seat:'.length)
  const lastColon = rest.lastIndexOf(':')
  if (lastColon === -1) return null
  const tableId = rest.slice(0, lastColon)
  const seatIndex = Number.parseInt(rest.slice(lastColon + 1), 10)
  if (
    !Number.isFinite(seatIndex) ||
    seatIndex < 0 ||
    seatIndex >= SEATS_PER_TABLE
  ) {
    return null
  }
  return { tableId, seatIndex }
}

export function useWeddingState() {
  const [state, setState] = useState<WeddingState>(() => loadState() ?? emptyState())

  useEffect(() => {
    saveState(state)
  }, [state])

  const addGuest = useCallback((name: string, specialNeedsNote = '') => {
    const trimmed = name.trim()
    if (!trimmed) return
    const guest: Guest = {
      id: newId(),
      name: trimmed,
      specialNeedsNote: specialNeedsNote.trim(),
    }
    setState((s) => ({
      ...s,
      guests: [...s.guests, guest],
      assignments: { ...s.assignments, [guest.id]: null },
    }))
  }, [])

  const updateGuest = useCallback(
    (guestId: string, patch: { name?: string; specialNeedsNote?: string }) => {
      setState((s) => ({
        ...s,
        guests: s.guests.map((g) => {
          if (g.id !== guestId) return g
          const next = { ...g }
          if (patch.name !== undefined) {
            const trimmed = patch.name.trim()
            if (trimmed) next.name = trimmed
          }
          if (patch.specialNeedsNote !== undefined) {
            next.specialNeedsNote = patch.specialNeedsNote.trim()
          }
          return next
        }),
      }))
    },
    [],
  )

  const removeGuest = useCallback((guestId: string) => {
    setState((s) => {
      const restAssignments = { ...s.assignments }
      delete restAssignments[guestId]
      return {
        ...s,
        guests: s.guests.filter((g) => g.id !== guestId),
        assignments: restAssignments,
      }
    })
  }, [])

  /** Clear seat assignment only; guest stays in the list (unassigned pool). */
  const unseatGuest = useCallback((guestId: string) => {
    setState((s) => ({
      ...s,
      assignments: { ...s.assignments, [guestId]: null },
    }))
  }, [])

  const addTable = useCallback((label: string) => {
    const trimmed = label.trim()
    if (!trimmed) return
    const table: Table = {
      id: newId(),
      label: trimmed,
      paletteId: DEFAULT_TABLE_PALETTE_ID,
    }
    setState((s) => ({
      ...s,
      tables: [...s.tables, table],
    }))
  }, [])

  const setTablePalette = useCallback((tableId: string, paletteId: TablePaletteId) => {
    setState((s) => ({
      ...s,
      tables: s.tables.map((t) => (t.id === tableId ? { ...t, paletteId } : t)),
    }))
  }, [])

  const removeTable = useCallback((tableId: string) => {
    setState((s) => ({
      ...s,
      tables: s.tables.filter((t) => t.id !== tableId),
      assignments: Object.fromEntries(
        Object.entries(s.assignments).map(([gid, a]) => {
          if (a && a.tableId === tableId) return [gid, null]
          return [gid, a]
        }),
      ) as Record<string, SeatAssignment | null>,
    }))
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const guestId = String(active.id)
    const overId = String(over.id)

    if (overId === 'unassigned') {
      setState((s) => ({
        ...s,
        assignments: { ...s.assignments, [guestId]: null },
      }))
      return
    }

    const seat = parseSeatDroppable(overId)
    if (!seat) return

    const { tableId, seatIndex } = seat

    setState((s) => {
      const a = { ...s.assignments }
      const occupantId = Object.entries(a).find(
        ([gid, val]) =>
          gid !== guestId &&
          val !== null &&
          val.tableId === tableId &&
          val.seatIndex === seatIndex,
      )?.[0]

      if (occupantId) {
        const gA = a[guestId]
        const gB = a[occupantId]
        a[guestId] = gB
        a[occupantId] = gA
      } else {
        a[guestId] = { tableId, seatIndex }
      }
      return { ...s, assignments: a }
    })
  }, [])

  const unassignedGuests = useMemo(() => {
    return state.guests.filter((g) => state.assignments[g.id] == null)
  }, [state.guests, state.assignments])

  const seatsForTable = useCallback(
    (tableId: string): (Guest | null)[] => {
      const slots: (Guest | null)[] = Array(SEATS_PER_TABLE).fill(null)
      for (const g of state.guests) {
        const a = state.assignments[g.id]
        if (a && a.tableId === tableId) {
          slots[a.seatIndex] = g
        }
      }
      return slots
    },
    [state.guests, state.assignments],
  )

  const tableOccupancy = useCallback(
    (tableId: string) => {
      return state.guests.filter((g) => {
        const a = state.assignments[g.id]
        return a && a.tableId === tableId
      }).length
    },
    [state.guests, state.assignments],
  )

  const replaceState = useCallback((next: WeddingState) => {
    setState(next)
  }, [])

  return {
    state,
    replaceState,
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
  }
}
