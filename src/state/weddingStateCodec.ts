import { DEFAULT_TABLE_PALETTE_ID, isTablePaletteId } from '../lib/tablePalettes'
import { SEATS_PER_TABLE } from './constants'
import type { Guest, SeatAssignment, Table, WeddingState } from './types'

function normalizeGuest(raw: {
  id: string
  name: string
  specialNeedsNote?: string
  hasSpecialNeeds?: boolean
}): Guest {
  let note = typeof raw.specialNeedsNote === 'string' ? raw.specialNeedsNote.trim() : ''
  if (!note && raw.hasSpecialNeeds === true) {
    note = 'Special needs'
  }
  return {
    id: raw.id,
    name: raw.name,
    specialNeedsNote: note,
  }
}

function migrateV2ToV3(
  guests: Guest[],
  assignments: Record<string, string | null>,
): Record<string, SeatAssignment | null> {
  const next: Record<string, SeatAssignment | null> = {}
  const byTable = new Map<string, string[]>()

  for (const g of guests) {
    const tid = assignments[g.id]
    if (tid != null) {
      if (!byTable.has(tid)) byTable.set(tid, [])
      byTable.get(tid)!.push(g.id)
    }
  }

  for (const g of guests) {
    next[g.id] = null
  }

  for (const [tid, gids] of byTable) {
    const sorted = [...gids].sort((a, b) => {
      const na = guests.find((x) => x.id === a)!.name
      const nb = guests.find((x) => x.id === b)!.name
      return na.localeCompare(nb)
    })
    sorted.forEach((gid, i) => {
      if (i < SEATS_PER_TABLE) {
        next[gid] = { tableId: tid, seatIndex: i }
      } else {
        next[gid] = null
      }
    })
  }

  return next
}

function normalizeV3Assignments(
  raw: Record<string, unknown>,
  guests: Guest[],
): Record<string, SeatAssignment | null> {
  const out: Record<string, SeatAssignment | null> = {}
  for (const g of guests) {
    const v = raw[g.id]
    if (v == null) {
      out[g.id] = null
      continue
    }
    if (typeof v !== 'object' || v === null) {
      out[g.id] = null
      continue
    }
    const o = v as { tableId?: string; seatIndex?: number }
    if (
      typeof o.tableId === 'string' &&
      typeof o.seatIndex === 'number' &&
      o.seatIndex >= 0 &&
      o.seatIndex < SEATS_PER_TABLE
    ) {
      out[g.id] = { tableId: o.tableId, seatIndex: o.seatIndex }
    } else {
      out[g.id] = null
    }
  }
  return out
}

function parseGuestArray(raw: unknown): Guest[] | null {
  if (!Array.isArray(raw)) return null
  const out: Guest[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') return null
    const g = item as Record<string, unknown>
    if (typeof g.id !== 'string' || typeof g.name !== 'string') return null
    out.push(
      normalizeGuest({
        id: g.id,
        name: g.name,
        specialNeedsNote: g.specialNeedsNote as string | undefined,
        hasSpecialNeeds: g.hasSpecialNeeds as boolean | undefined,
      }),
    )
  }
  return out
}

function parseTablesArray(raw: unknown): Table[] | null {
  if (!Array.isArray(raw)) return null
  const out: Table[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') return null
    const t = item as Record<string, unknown>
    if (typeof t.id !== 'string' || typeof t.label !== 'string') return null
    const paletteRaw = t.paletteId
    const paletteId =
      typeof paletteRaw === 'string' && isTablePaletteId(paletteRaw)
        ? paletteRaw
        : DEFAULT_TABLE_PALETTE_ID
    out.push({ id: t.id, label: t.label, paletteId })
  }
  return out
}

/** Clear seat assignments that reference unknown table ids. */
function sanitizeState(state: WeddingState): WeddingState {
  const tableIds = new Set(state.tables.map((t) => t.id))
  const assignments = { ...state.assignments }
  for (const g of state.guests) {
    const a = assignments[g.id]
    if (a && !tableIds.has(a.tableId)) {
      assignments[g.id] = null
    }
  }
  return { ...state, assignments }
}

/**
 * Parse and validate config JSON (same rules as localStorage).
 * Accepts v1/v2/v3 and migrates to v3.
 */
export function parseWeddingState(parsed: unknown): WeddingState | null {
  try {
    if (!parsed || typeof parsed !== 'object') return null
    const o = parsed as Record<string, unknown>
    if (!o.assignments || typeof o.assignments !== 'object') return null

    const guests = parseGuestArray(o.guests)
    const tables = parseTablesArray(o.tables)
    if (!guests || !tables) return null

    const version = o.version ?? 1

    if (version === 3) {
      const assignments = normalizeV3Assignments(
        o.assignments as Record<string, unknown>,
        guests,
      )
      return sanitizeState({ version: 3, guests, tables, assignments })
    }

    if (version === 1 || version === 2) {
      const assignmentsV2 = o.assignments as Record<string, string | null>
      const assignments = migrateV2ToV3(guests, assignmentsV2)
      return sanitizeState({ version: 3, guests, tables, assignments })
    }

    return null
  } catch {
    return null
  }
}

export function emptyState(): WeddingState {
  return {
    version: 3,
    guests: [],
    tables: [],
    assignments: {},
  }
}
