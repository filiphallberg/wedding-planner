import type { EventState, Guest } from '../types';
import { newId } from './newId';

export function addGuestToState(
  state: EventState,
  name: string,
  specialNeedsNote = '',
): EventState | null {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const guest: Guest = {
    id: newId(),
    name: trimmed,
    specialNeedsNote: specialNeedsNote.trim(),
  };
  return {
    ...state,
    guests: [...state.guests, guest],
    assignments: { ...state.assignments, [guest.id]: null },
  };
}

export function updateGuestInState(
  state: EventState,
  guestId: string,
  patch: { name?: string; specialNeedsNote?: string },
): EventState {
  return {
    ...state,
    guests: state.guests.map((g) => {
      if (g.id !== guestId) return g;
      const next = { ...g };
      if (patch.name !== undefined) {
        const trimmed = patch.name.trim();
        if (trimmed) next.name = trimmed;
      }
      if (patch.specialNeedsNote !== undefined) {
        next.specialNeedsNote = patch.specialNeedsNote.trim();
      }
      return next;
    }),
  };
}

export function removeGuestFromState(state: EventState, guestId: string): EventState {
  const restAssignments = { ...state.assignments };
  delete restAssignments[guestId];
  return {
    ...state,
    guests: state.guests.filter((g) => g.id !== guestId),
    assignments: restAssignments,
  };
}

export function unseatGuestInState(state: EventState, guestId: string): EventState {
  return {
    ...state,
    assignments: { ...state.assignments, [guestId]: null },
  };
}
