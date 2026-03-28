import { jsPDF } from 'jspdf'
import { compareStringsNatural } from '../lib/compareStringsNatural'
import { SEATS_PER_TABLE } from '../state/constants'
import type { Guest, WeddingState } from '../state/types'

function getSeatsForTable(state: WeddingState, tableId: string): (Guest | null)[] {
  const slots: (Guest | null)[] = Array(SEATS_PER_TABLE).fill(null)
  for (const g of state.guests) {
    const a = state.assignments[g.id]
    if (a && a.tableId === tableId) {
      slots[a.seatIndex] = g
    }
  }
  return slots
}

function hasNeedsNote(g: Guest): boolean {
  return g.specialNeedsNote.trim().length > 0
}

/** Builds a printable seating PDF and triggers a browser download. */
export function downloadSeatingPdf(state: WeddingState): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 14
  const maxW = pageW - margin * 2
  const lh = 5
  let y = margin

  const ensureSpace = (h: number) => {
    if (y + h > 285) {
      doc.addPage()
      y = margin
    }
  }

  const writeLines = (lines: string[], size = 10, style: 'normal' | 'bold' = 'normal') => {
    doc.setFont('helvetica', style)
    doc.setFontSize(size)
    for (const line of lines) {
      ensureSpace(lh)
      doc.text(line, margin, y)
      y += lh
    }
    y += 2
  }

  const writeBlock = (text: string, size = 10, style: 'normal' | 'bold' = 'normal') => {
    doc.setFont('helvetica', style)
    doc.setFontSize(size)
    const wrapped = doc.splitTextToSize(text, maxW) as string[]
    for (const line of wrapped) {
      ensureSpace(lh)
      doc.text(line, margin, y)
      y += lh
    }
    y += 2
  }

  const dateStr = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  writeLines(['Wedding seating'], 18, 'bold')
  writeBlock(`Generated ${dateStr}`, 10, 'normal')

  const tablesSorted = [...state.tables].sort((a, b) =>
    compareStringsNatural(a.label, b.label),
  )

  if (tablesSorted.length === 0) {
    writeBlock('No tables defined yet.', 10)
  } else {
    for (const table of tablesSorted) {
      writeLines([table.label], 12, 'bold')
      const seats = getSeatsForTable(state, table.id)
      const occupied = seats.filter(Boolean).length
      writeBlock(`${occupied}/${SEATS_PER_TABLE} seats`, 9)
      for (let i = 0; i < SEATS_PER_TABLE; i++) {
        const g = seats[i]
        if (!g) {
          writeBlock(`Seat ${i + 1}: —`, 10)
          continue
        }
        writeBlock(`Seat ${i + 1}: ${g.name}`, 10)
        if (hasNeedsNote(g)) {
          writeBlock(`    ${g.specialNeedsNote.trim()}`, 9)
        }
      }
      y += 2
    }
  }

  writeLines(['Unassigned guests'], 12, 'bold')
  const unassigned = state.guests.filter((g) => state.assignments[g.id] == null)
  if (unassigned.length === 0) {
    writeBlock('None.', 10)
  } else {
    for (const g of [...unassigned].sort((a, b) => a.name.localeCompare(b.name))) {
      writeBlock(`• ${g.name}`, 10)
      if (hasNeedsNote(g)) {
        writeBlock(`    ${g.specialNeedsNote.trim()}`, 9)
      }
    }
  }

  const withNeeds = state.guests.filter((g) => hasNeedsNote(g))
  if (withNeeds.length > 0) {
    y += 4
    writeLines(['Special needs (all guests)'], 11, 'bold')
    for (const g of [...withNeeds].sort((a, b) => a.name.localeCompare(b.name))) {
      const a = state.assignments[g.id]
      const loc =
        a == null
          ? 'Unassigned'
          : (() => {
              const t = state.tables.find((x) => x.id === a.tableId)
              return `${t?.label ?? 'Table'} · seat ${a.seatIndex + 1}`
            })()
      writeBlock(`• ${g.name} — ${loc}`, 10)
      writeBlock(`    ${g.specialNeedsNote.trim()}`, 9)
    }
  }

  const safeDate = new Date().toISOString().slice(0, 10)
  doc.save(`wedding-seating-${safeDate}.pdf`)
}
