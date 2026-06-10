import { type PointerEvent as ReactPointerEvent, useRef, useState } from 'react';
import { clampRosterWidth } from '../utils/clampRosterWidth';
import { persistRosterWidth, readStoredRosterWidth } from '../utils/rosterWidthStorage';

export function useRosterWidth() {
  const [rosterWidth, setRosterWidth] = useState(readStoredRosterWidth);
  const rosterResizeRef = useRef<{ startX: number; startWidth: number } | null>(null);

  const onRosterResizePointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    rosterResizeRef.current = { startX: e.clientX, startWidth: rosterWidth };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onRosterResizePointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!rosterResizeRef.current) return;
    const delta = e.clientX - rosterResizeRef.current.startX;
    setRosterWidth(clampRosterWidth(rosterResizeRef.current.startWidth + delta));
  };

  const onRosterResizePointerUp = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!rosterResizeRef.current) return;
    const finalWidth = clampRosterWidth(
      rosterResizeRef.current.startWidth + (e.clientX - rosterResizeRef.current.startX),
    );
    rosterResizeRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
    setRosterWidth(finalWidth);
    persistRosterWidth(finalWidth);
  };

  return {
    rosterWidth,
    onRosterResizePointerDown,
    onRosterResizePointerMove,
    onRosterResizePointerUp,
  };
}
