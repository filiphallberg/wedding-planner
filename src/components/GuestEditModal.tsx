import { useState } from 'react'
import type { Guest } from '../state/types'

type Props = {
  guest: Guest
  onClose: () => void
  onSave: (guestId: string, patch: { name: string; specialNeedsNote: string }) => void
}

export function GuestEditModal({ guest, onClose, onSave }: Props) {
  const [name, setName] = useState(guest.name)
  const [specialNeedsNote, setSpecialNeedsNote] = useState(guest.specialNeedsNote)

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/20 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-edit-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="w-full max-w-sm rounded-lg border border-stone-200 bg-white p-5 shadow-lg"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 id="guest-edit-title" className="text-base font-medium text-stone-900">
          Edit guest
        </h2>
        <form
          className="mt-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            const trimmed = name.trim()
            if (!trimmed) return
            onSave(guest.id, { name: trimmed, specialNeedsNote })
            onClose()
          }}
        >
          <div>
            <label htmlFor="edit-name" className="block text-xs font-medium text-stone-600">
              Name
            </label>
            <input
              id="edit-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border border-stone-200 px-2.5 py-1.5 text-sm text-stone-800 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="edit-needs" className="block text-xs font-medium text-stone-600">
              Dietary / special needs (optional)
            </label>
            <textarea
              id="edit-needs"
              value={specialNeedsNote}
              onChange={(e) => setSpecialNeedsNote(e.target.value)}
              rows={3}
              placeholder="e.g. vegetarian, nut allergy, wheelchair access"
              className="mt-1 w-full resize-y rounded-md border border-stone-200 px-2.5 py-1.5 text-sm text-stone-800 placeholder:text-stone-400 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
            />
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
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
