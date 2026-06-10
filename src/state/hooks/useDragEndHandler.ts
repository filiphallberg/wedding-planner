import type { DragEndEvent } from '@dnd-kit/core';
import { type Dispatch, type SetStateAction, useCallback } from 'react';
import type { EventState } from '../types';
import { applyEventDragEnd } from '../utils/applyEventDragEnd';

export function useDragEndHandler(setState: Dispatch<SetStateAction<EventState>>) {
  return useCallback(
    (event: DragEndEvent): string[] => {
      let flashGuestIds: string[] = [];
      setState((prev) => {
        const applied = applyEventDragEnd(prev, event);
        if (!applied) return prev;
        flashGuestIds = applied.flashGuestIds;
        return applied.next;
      });
      return flashGuestIds;
    },
    [setState],
  );
}
