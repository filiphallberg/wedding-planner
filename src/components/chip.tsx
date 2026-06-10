import type { ComponentProps } from 'react';
import type { Guest } from '../state/types';
import { useSeatingInteractions } from '../app/seating/context/SeatingInteractionsContext';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { tv } from 'tailwind-variants';
import { Ellipsis } from 'lucide-react';
import { cn } from '../utils';

const chipVariants = tv({
  slots: {
    base: 'inline-block max-w-full outline-none focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-50',
    body: 'flex w-auto max-w-full flex-col rounded-xl text-stone-900 px-2 py-1',
    name: 'min-w-0 flex-1 truncate text-sm font-semibold select-none',
    note: 'text-xs leading-snug min-w-0 whitespace-normal wrap-break-word text-stone-600 line-clamp-2',
  },
  variants: {
    variant: {
      drag: {
        body: 'border border-stone-300 bg-white shadow-lg ring-1 ring-stone-300/50 scale-[1.02]',
      },
      default: {
        body: cn(
          'border border-stone-200/80 bg-white',
          'motion-safe:transition-[transform,border-color,box-shadow]',
          'motion-safe:duration-200 motion-safe:ease-out',
          'motion-safe:hover:-translate-y-0.5 motion-safe:hover:border-stone-300 motion-safe:hover:shadow-sm',
          'motion-reduce:hover:translate-y-0',
        ),
      },
    },
    scrollable: {
      true: {
        base: 'touch-pan-x lg:touch-none',
      },
      false: {
        base: 'touch-none',
      },
    },
  },
  defaultVariants: {
    scrollable: false,
  },
});

export type ChipBodyProps = ComponentProps<'div'> & {
  guest: Guest;
  variant?: 'default' | 'drag';
  actions?: boolean;
  nameDragProps?: ComponentProps<'span'>;
};

export function ChipBody({
  guest,
  actions = true,
  variant = 'default',
  nameDragProps,
  className,
  ...props
}: ChipBodyProps) {
  const { onEditGuest } = useSeatingInteractions();
  const slots = chipVariants({ variant, className });

  return (
    <div title={guest.name} className={slots.body()} {...props}>
      <div className="flex min-w-0 items-center gap-1">
        <span
          {...nameDragProps}
          className={cn(
            slots.name(),
            nameDragProps ? 'cursor-grab touch-pan-x active:cursor-grabbing' : undefined,
          )}
        >
          {guest.name}
        </span>
        {actions ? (
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onEditGuest(guest);
              }}
              className="cursor-pointer rounded-md px-1.5 text-xs font-semibold text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800"
              aria-label={`Edit ${guest.name}`}
            >
              <Ellipsis className="size-4" />
            </button>
          </div>
        ) : null}
      </div>
      {guest.specialNeedsNote.length ? (
        <p className={slots.note()}>{guest.specialNeedsNote.trim()}</p>
      ) : null}
    </div>
  );
}

export type ChipProps = ComponentProps<'div'> & {
  guest: Guest;
  /** Horizontal pool: name drags, note/edit scroll and tap. */
  scrollable?: boolean;
};

export default function Chip({ guest, scrollable = false, className, ...props }: ChipProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: guest.id,
  });

  const style = isDragging
    ? { opacity: 0 }
    : transform
      ? { transform: CSS.Translate.toString(transform) }
      : undefined;

  const dragProps = { ...listeners, ...attributes };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={chipVariants().base({ scrollable, className })}
      {...props}
      {...(scrollable ? {} : dragProps)}
    >
      <ChipBody
        guest={guest}
        actions
        nameDragProps={scrollable ? dragProps : undefined}
        className={scrollable ? undefined : 'cursor-grab active:cursor-grabbing'}
      />
    </div>
  );
}
