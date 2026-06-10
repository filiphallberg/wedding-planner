import { type Dispatch, type SetStateAction, useCallback } from 'react';
import type { EventState } from '../types';
import {
  addGuestToState,
  removeGuestFromState,
  unseatGuestInState,
  updateGuestInState,
} from '../utils/guestMutations';

export function useGuestActions(setState: Dispatch<SetStateAction<EventState>>) {
  const addGuest = useCallback(
    (name: string, specialNeedsNote = '') => {
      setState((s) => addGuestToState(s, name, specialNeedsNote) ?? s);
    },
    [setState],
  );

  const updateGuest = useCallback(
    (guestId: string, patch: { name?: string; specialNeedsNote?: string }) => {
      setState((s) => updateGuestInState(s, guestId, patch));
    },
    [setState],
  );

  const removeGuest = useCallback(
    (guestId: string) => {
      setState((s) => removeGuestFromState(s, guestId));
    },
    [setState],
  );

  const unseatGuest = useCallback(
    (guestId: string) => {
      setState((s) => unseatGuestInState(s, guestId));
    },
    [setState],
  );

  return { addGuest, updateGuest, removeGuest, unseatGuest };
}
