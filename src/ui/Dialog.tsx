import { type ReactNode, useEffect, useRef, useState } from 'react';
import { cn } from '../utils';

export type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  titleId: string;
  children: ReactNode;
  /** Tailwind z-index class (e.g. z-[100], z-[300]). */
  zIndexClass?: string;
  /** Max width for the panel (Tailwind class). */
  panelMaxWidthClass?: string;
};

const EXIT_MS = 240;

/**
 * Modal shell using the native <dialog> element (showModal / backdrop / focus trap).
 * Closing runs a short exit animation before calling <dialog>.close().
 */
export function Dialog({
  open,
  onClose,
  title,
  titleId,
  children,
  zIndexClass = 'z-[100]',
  panelMaxWidthClass = 'max-w-sm',
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (open) {
      setExiting(false);
      if (!el.open) el.showModal();
      return;
    }

    if (!el.open) return;

    setExiting(true);
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      if (ref.current?.open) ref.current.close();
      setExiting(false);
    };
    const id = window.setTimeout(finish, EXIT_MS);
    return () => {
      window.clearTimeout(id);
    };
  }, [open]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };
    el.addEventListener('cancel', onCancel);
    return () => el.removeEventListener('cancel', onCancel);
  }, [onClose]);

  useEffect(
    () => () => {
      ref.current?.close();
    },
    [],
  );

  return (
    <dialog
      ref={ref}
      className={cn(
        'm-0 max-h-none w-full max-w-none border-0 bg-transparent p-0',
        'overscroll-contain backdrop:bg-stone-900/20',
        zIndexClass,
      )}
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        className="fixed inset-0 flex min-h-full min-w-0 w-full flex-col items-center justify-center overscroll-contain p-4"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          className={cn(
            'dialog-panel-motion w-full rounded-3xl border border-stone-200/80 bg-white p-7 shadow-xl shadow-stone-900/8',
            exiting && 'dialog-panel-exiting',
            panelMaxWidthClass,
          )}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <h2 id={titleId} className="font-display text-2xl font-bold text-stone-900">
            {title}
          </h2>
          {children}
        </div>
      </div>
    </dialog>
  );
}
