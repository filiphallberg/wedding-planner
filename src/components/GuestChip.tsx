import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
  type AnimationEventHandler,
  type ComponentProps,
  useEffect,
  useRef,
  useState,
} from 'react';
import { cn } from '../utils';

export type GuestChipBodyProps = {
  name: string;
  specialNeedsNote?: string;
  compact?: boolean;
  /** When false, Edit / × are hidden (e.g. drag overlay). */
  showActions?: boolean;
  onEdit?: () => void;
  onRemove?: () => void;
  removeAriaLabel?: string;
  className?: string;
  /** Lifted drag preview: stronger depth and no hover jitter. */
  variant?: 'default' | 'dragOverlay';
  onAnimationEnd?: AnimationEventHandler<HTMLDivElement>;
  /** Tighter layout below lg for horizontal pool strip. */
  pool?: boolean;
};

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
  variant = 'default',
  onAnimationEnd,
  pool = false,
}: GuestChipBodyProps) {
  const noteTrimmed = specialNeedsNote.trim();
  const hasNote = noteTrimmed.length > 0;
  const title = hasNote ? `${name} — ${noteTrimmed}` : name;

  const textNote = compact ? 'text-xs leading-snug' : 'text-sm leading-snug';
  const pad = pool
    ? 'px-2 py-1.5 lg:px-3.5 lg:py-2.5'
    : compact
      ? 'px-2.5 py-2'
      : 'px-3.5 py-2.5';
  const nameSize = pool
    ? 'text-sm font-semibold lg:text-base'
    : compact
      ? 'text-sm font-semibold'
      : 'text-base font-semibold';

  const shell =
    variant === 'dragOverlay'
      ? 'border border-stone-300 bg-white shadow-lg ring-1 ring-stone-300/50 scale-[1.02]'
      : cn(
          'border border-stone-200/80 bg-white',
          'motion-safe:transition-[transform,border-color,box-shadow]',
          'motion-safe:duration-200 motion-safe:ease-out',
          'motion-safe:hover:-translate-y-0.5 motion-safe:hover:border-stone-300 motion-safe:hover:shadow-sm',
          'motion-reduce:hover:translate-y-0',
        );

  return (
    <div
      title={title}
      onAnimationEnd={onAnimationEnd}
      className={cn(
        'flex w-auto max-w-full flex-col rounded-xl text-stone-900',
        pool ? 'gap-1 lg:gap-1.5' : 'gap-1.5',
        shell,
        pad,
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-0.5 lg:gap-1">
        {hasNote && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden />}
        <span className={cn('min-w-0 flex-1 truncate', nameSize)}>{name}</span>
        {showActions ? (
          <div className="flex shrink-0 items-center">
            {onEdit && (
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className={cn(
                  'cursor-pointer rounded-md font-semibold text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800',
                  pool ? 'px-1 text-[10px] lg:px-1.5 lg:text-xs' : 'px-1.5 text-xs',
                )}
              >
                Edit
              </button>
            )}
            {onRemove && (
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className={cn(
                  'cursor-pointer rounded-md font-semibold text-stone-400 transition-colors hover:bg-stone-100 hover:text-rose-600',
                  pool ? 'px-0.5 text-xs lg:px-1.5 lg:text-sm' : 'px-1.5 text-sm',
                )}
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
          className={cn(
            'min-w-0 whitespace-normal wrap-break-word text-stone-600',
            textNote,
            (compact || pool) && 'line-clamp-2',
            pool && 'hidden lg:block',
          )}
        >
          {noteTrimmed}
        </p>
      ) : null}
    </div>
  );
}

type Props = ComponentProps<'div'> & {
  id: string;
  name: string;
  specialNeedsNote?: string;
  /** Smaller chip for seats around an oval table. */
  compact?: boolean;
  /** Incremented when this guest is placed after a drag; triggers a short "pop". */
  landKey?: number;
  onRemove?: () => void;
  /** Default: `Remove {name}` — use on seats for unseat wording. */
  removeAriaLabel?: string;
  onEdit?: () => void;
  /** Allow horizontal scroll to pass through below lg (unassigned pool). */
  scrollable?: boolean;
  /** Tighter layout below lg for horizontal pool strip. */
  pool?: boolean;
};

export function GuestChip({
  id,
  name,
  specialNeedsNote = '',
  compact = false,
  landKey = 0,
  onRemove,
  removeAriaLabel,
  onEdit,
  scrollable = false,
  pool = false,
  className,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    data: { compact },
  });

  const [popping, setPopping] = useState(false);
  const prevLand = useRef(landKey);
  useEffect(() => {
    if (landKey !== prevLand.current && landKey > 0) {
      setPopping(true);
    }
    prevLand.current = landKey;
  }, [landKey]);

  const style = isDragging
    ? { opacity: 0 }
    : transform
      ? { transform: CSS.Translate.toString(transform) }
      : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        'inline-block max-w-full outline-none',
        scrollable ? 'touch-pan-x lg:touch-none' : 'touch-none',
        'focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-50',
        className,
      )}
    >
      <GuestChipBody
        name={name}
        specialNeedsNote={specialNeedsNote}
        compact={compact}
        pool={pool}
        onEdit={onEdit}
        onRemove={onRemove}
        removeAriaLabel={removeAriaLabel}
        className={cn('cursor-grab active:cursor-grabbing', popping ? 'guest-pop-motion' : null)}
        onAnimationEnd={() => setPopping(false)}
      />
    </div>
  );
}
