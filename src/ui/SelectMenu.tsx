import { type ReactNode, useEffect, useId, useRef } from 'react';
import { cn } from '../utils';

export type SelectMenuOption<T extends string = string> = { value: T; label: string };

type Props<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: readonly SelectMenuOption<T>[];
  /** Accessible name for the control (summary has no visible static label). */
  'aria-label': string;
  className?: string;
  summaryClassName?: string;
  align?: 'start' | 'end';
  disabled?: boolean;
};

/**
 * Single-choice dropdown styled like MenuDisclosure; does not use native <select>.
 */
export function SelectMenu<T extends string>({
  value,
  onChange,
  options,
  'aria-label': ariaLabel,
  className,
  summaryClassName,
  align = 'start',
  disabled = false,
}: Props<T>) {
  const ref = useRef<HTMLDetailsElement>(null);
  const listId = useId();
  const selected = options.find((o) => o.value === value);
  const summaryLabel = selected?.label ?? value;

  useEffect(() => {
    const onDocPointerDown = (e: PointerEvent) => {
      const el = ref.current;
      if (!el?.open) return;
      if (e.target instanceof Node && el.contains(e.target)) return;
      el.removeAttribute('open');
    };
    document.addEventListener('pointerdown', onDocPointerDown);
    return () => document.removeEventListener('pointerdown', onDocPointerDown);
  }, []);

  return (
    <details ref={ref} className={cn('group relative', disabled && 'opacity-50', className)}>
      <summary
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-controls={listId}
        aria-disabled={disabled}
        className={cn(
          'flex cursor-pointer list-none items-center gap-2 rounded-xl border border-stone-200/80 bg-white px-3.5 py-2.5 text-sm font-semibold text-stone-900',
          'transition-colors duration-150 hover:border-stone-300 hover:bg-stone-50',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-500',
          disabled && 'cursor-not-allowed hover:border-stone-200 hover:bg-white',
          '[&::-webkit-details-marker]:hidden',
          summaryClassName,
        )}
        onClick={(e) => {
          if (disabled) e.preventDefault();
        }}
      >
        <span className="min-w-0 truncate">{summaryLabel}</span>
        <span
          className="shrink-0 text-stone-400 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
          aria-hidden
        >
          ▾
        </span>
      </summary>
      <div
        id={listId}
        role="listbox"
        className={cn(
          'menu-panel absolute z-40 mt-2 min-w-[calc(100%+0px)] rounded-2xl border border-stone-200/80 bg-white p-1.5 shadow-lg shadow-stone-900/6',
          align === 'end' ? 'right-0' : 'left-0',
        )}
      >
        {options.map((opt) => (
          <SelectMenuRow
            key={opt.value}
            selected={opt.value === value}
            onPick={() => {
              onChange(opt.value);
              ref.current?.removeAttribute('open');
            }}
          >
            {opt.label}
          </SelectMenuRow>
        ))}
      </div>
    </details>
  );
}

function SelectMenuRow({
  children,
  selected,
  onPick,
}: {
  children: ReactNode;
  selected: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      className={cn(
        'flex w-full cursor-pointer items-center rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition-colors duration-150',
        selected ? 'bg-stone-100 font-semibold text-stone-900' : 'text-stone-800 hover:bg-stone-50',
      )}
      onClick={onPick}
    >
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {selected ? (
        <span className="ml-2 shrink-0 text-xs text-stone-500" aria-hidden>
          ✓
        </span>
      ) : null}
    </button>
  );
}
