import { ChevronDown } from 'lucide-react';
import { type ButtonHTMLAttributes, type ReactNode, useEffect, useRef } from 'react';
import { cn } from '../utils';

type Props = {
  label: string;
  /** Panel alignment relative to the summary control. */
  align?: 'start' | 'end';
  children: ReactNode;
  className?: string;
  summaryClassName?: string;
};

/**
 * Lightweight menu using <details>: one focusable summary, panel animates open.
 * Closes when clicking outside or after activating a control inside the panel.
 */
export function MenuDisclosure({
  label,
  align = 'start',
  children,
  className,
  summaryClassName,
}: Props) {
  const ref = useRef<HTMLDetailsElement>(null);

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
    <details ref={ref} className={cn('group relative', className)}>
      <summary
        className={cn(
          'flex cursor-pointer list-none items-center gap-1.5 rounded-md border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-800 transition-colors hover:border-stone-300 hover:bg-stone-50',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-400',
          '[&::-webkit-details-marker]:hidden',
          summaryClassName,
        )}
      >
        <span className="min-w-0 truncate">{label}</span>
        <span
          className="text-stone-400 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
          aria-hidden
        >
          <ChevronDown className="size-4 shrink-0 opacity-90" aria-hidden strokeWidth={2} />
        </span>
      </summary>
      <div
        className={cn(
          'menu-panel absolute z-40 mt-1 min-w-48 rounded-lg border border-stone-200 bg-white p-1',
          align === 'end' ? 'right-0' : 'left-0',
        )}
      >
        {children}
      </div>
    </details>
  );
}

export function MenuSectionTitle({ children }: { children: ReactNode }) {
  return (
    <div className="px-3 pb-1 pt-2 text-[0.65rem] font-semibold uppercase tracking-wide text-stone-500 first:pt-1">
      {children}
    </div>
  );
}

export type MenuRowProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'danger';
};

export function MenuRow({
  className,
  variant = 'default',
  type = 'button',
  onClick,
  ...props
}: MenuRowProps) {
  return (
    <button
      type={type}
      className={cn(
        'flex w-full cursor-pointer items-center rounded-md px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'danger'
          ? 'text-rose-800 hover:bg-rose-50'
          : 'text-stone-800 hover:bg-stone-50',
        className,
      )}
      onClick={(e) => {
        onClick?.(e);
        (e.currentTarget.closest('details') as HTMLDetailsElement | null)?.removeAttribute('open');
      }}
      {...props}
    />
  );
}
