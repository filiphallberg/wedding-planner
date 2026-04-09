import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '../utils'
import type { ComponentProps } from 'react'

export type GuestChipBodyProps = {
  name: string
  specialNeedsNote?: string
  compact?: boolean
  /** When false, Edit / × are hidden (e.g. drag overlay). */
  showActions?: boolean
  onEdit?: () => void
  onRemove?: () => void
  removeAriaLabel?: string
  className?: string
}

/** Presentational chip (no DnD). Used inside {@link GuestChip} and {@link DragOverlay}. */
export function GuestChipBody({
  name,
  specialNeedsNote = '',
  compact = false,
  showActions = true,
  onEdit,
  onRemove,
  removeAriaLabel,
  className = '',
}: GuestChipBodyProps) {
  const noteTrimmed = specialNeedsNote.trim()
  const hasNote = noteTrimmed.length > 0
  const title = hasNote ? `${name} — ${noteTrimmed}` : name

  const textNote = compact ? 'text-[0.65rem] leading-snug' : 'text-xs leading-snug'
  const pad = compact ? 'px-2 py-1.5' : 'px-2.5 py-1.5'
  const nameSize = compact ? 'text-xs' : 'text-sm'

  return (
    <div
      title={title}
      className={`flex w-auto max-w-full flex-col gap-1 rounded-md border border-stone-200 bg-white text-stone-800 shadow-sm ${pad} ${className}`}
    >
      <div className="flex min-w-0 items-center gap-1">
        {hasNote && (
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"
            aria-hidden
          />
        )}
        <span className={`min-w-0 flex-1 truncate ${nameSize}`}>{name}</span>
        {showActions ? (
          <div className="flex shrink-0 items-center gap-0.5">
            {onEdit && (
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit()
                }}
                className="rounded px-1 text-[0.65rem] text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              >
                Edit
              </button>
            )}
            {onRemove && (
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove()
                }}
                className="rounded px-1 text-xs text-stone-400 hover:bg-stone-100 hover:text-stone-600"
                aria-label={removeAriaLabel ?? `Remove ${name}`}
              >
                ×
              </button>
            )}
          </div>
        ) : null}
      </div>
      {hasNote ? (
        <p
          className={`min-w-0 whitespace-normal wrap-break-word text-stone-500 ${textNote} ${compact ? 'line-clamp-2' : ''
            }`}
        >
          {noteTrimmed}
        </p>
      ) : null}
    </div>
  )
}

type Props = ComponentProps<"div"> & {
  id: string
  name: string
  specialNeedsNote?: string
  /** Smaller chip for seats around an oval table. */
  compact?: boolean
  onRemove?: () => void
  /** Default: `Remove {name}` — use on seats for unseat wording. */
  removeAriaLabel?: string
  onEdit?: () => void
}

export function GuestChip({
  id,
  name,
  specialNeedsNote = '',
  compact = false,
  onRemove,
  removeAriaLabel,
  onEdit,
  className,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    data: { compact },
  })

  // With DragOverlay, do not translate the source while dragging — transform still
  // affects scroll overflow on ancestors (overflow-auto / sticky) even at opacity 0.
  const style = isDragging
    ? { opacity: 0 }
    : transform
      ? { transform: CSS.Translate.toString(transform) }
      : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn("inline-block max-w-full touch-none outline-none", className)}
    >
      <GuestChipBody
        name={name}
        specialNeedsNote={specialNeedsNote}
        compact={compact}
        onEdit={onEdit}
        onRemove={onRemove}
        removeAriaLabel={removeAriaLabel}
        className="cursor-grab active:cursor-grabbing"
      />
    </div>
  )
}
