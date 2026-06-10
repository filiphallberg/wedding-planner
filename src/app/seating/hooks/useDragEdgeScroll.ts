import { type RefObject, useEffect } from 'react';
import { applyDragEdgeScroll } from '../utils/dragEdgeScroll';

type ActiveDrag = { guest: unknown; compact: boolean } | null;

export function useDragEdgeScroll(
  mainScrollRef: RefObject<HTMLElement | null>,
  activeDragGuest: ActiveDrag,
  dragPointer: { x: number; y: number } | null,
) {
  useEffect(() => {
    if (!activeDragGuest || !dragPointer) return;

    let raf = 0;
    const tick = () => {
      const el = mainScrollRef.current;
      if (el) applyDragEdgeScroll(el, dragPointer);
      raf = window.requestAnimationFrame(tick);
    };

    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [activeDragGuest, dragPointer, mainScrollRef]);
}
