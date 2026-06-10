import { DEFAULT_ROSTER_WIDTH, ROSTER_WIDTH_KEY } from '../constants';
import { clampRosterWidth } from './clampRosterWidth';

export function readStoredRosterWidth(): number {
  try {
    const raw = localStorage.getItem(ROSTER_WIDTH_KEY);
    if (!raw) return DEFAULT_ROSTER_WIDTH;
    const n = Number(raw);
    if (!Number.isFinite(n)) return DEFAULT_ROSTER_WIDTH;
    return clampRosterWidth(n);
  } catch {
    return DEFAULT_ROSTER_WIDTH;
  }
}

export function persistRosterWidth(width: number): void {
  try {
    localStorage.setItem(ROSTER_WIDTH_KEY, String(width));
  } catch {
    /* ignore quota errors */
  }
}
