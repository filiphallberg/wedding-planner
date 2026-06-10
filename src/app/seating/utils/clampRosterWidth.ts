import { MAX_ROSTER_WIDTH, MIN_ROSTER_WIDTH } from '../constants';

export function clampRosterWidth(width: number): number {
  return Math.min(MAX_ROSTER_WIDTH, Math.max(MIN_ROSTER_WIDTH, width));
}
