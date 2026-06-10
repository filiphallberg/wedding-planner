import type { PointerEvent as ReactPointerEvent } from 'react';
import { cn } from '../../../utils';

type Props = {
  onPointerDown: (e: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerMove: (e: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (e: ReactPointerEvent<HTMLButtonElement>) => void;
};

export function RosterResizeHandle({ onPointerDown, onPointerMove, onPointerUp }: Props) {
  return (
    <button
      type="button"
      aria-label="Resize roster panel"
      className={cn(
        'group relative hidden w-3 shrink-0 cursor-col-resize border-0 bg-transparent p-0 lg:block',
        'before:absolute before:inset-y-0 before:left-1/2 before:w-px before:-translate-x-1/2',
        'before:bg-stone-200/80 before:transition-colors hover:before:bg-stone-400',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-400',
      )}
      onClick={(e) => e.preventDefault()}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <span
        className="absolute left-1/2 top-1/2 h-8 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-stone-300 opacity-0 transition-opacity group-hover:opacity-100"
        aria-hidden
      />
    </button>
  );
}
