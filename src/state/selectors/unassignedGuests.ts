import type { EventState, Guest } from '../types';

export function selectUnassignedGuests(state: EventState): Guest[] {
  return state.guests.filter((g) => state.assignments[g.id] == null);
}
