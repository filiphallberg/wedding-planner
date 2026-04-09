import { useEffect, useState } from 'react'

type Props = {
  open: boolean
  onClose: () => void
  onAdd: (name: string, specialNeedsNote: string) => void
}

export function AddGuestDialog({ open, onClose, onAdd }: Props) {
  const [name, setName] = useState('')
  const [specialNeedsNote, setSpecialNeedsNote] = useState('')

  useEffect(() => {
    if (!open) {
      setName('')
      setSpecialNeedsNote('')
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/20 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-guest-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="w-full max-w-sm rounded-lg border border-stone-200 bg-white p-5 shadow-lg"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 id="add-guest-title" className="text-base font-medium text-stone-900">
          Add guest
        </h2>
        <form
          className="mt-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            const trimmed = name.trim()
            if (!trimmed) return
            onAdd(trimmed, specialNeedsNote)
            onClose()
          }}
        >
          <div>
            <label htmlFor="add-guest-name" className="block text-xs font-medium text-stone-600">
              Name
            </label>
            <input
              id="add-guest-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Guest name"
              className="mt-1 w-full rounded-md border border-stone-200 px-2.5 py-1.5 text-sm text-stone-800 placeholder:text-stone-400 focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="add-guest-needs" className="block text-xs font-medium text-stone-600">
              Dietary / special needs (optional)
            </label>
            <textarea
              id="add-guest-needs"
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
              Add guest
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
