import type { DragEndEvent } from '@dnd-kit/core';
import { type Dispatch, type SetStateAction, useCallback } from 'react';
import type { EventState } from '../types';
import { applyEventDragEnd } from '../utils/applyEventDragEnd';

export function useDragEndHandler(setState: Dispatch<SetStateAction<EventState>>) {
  return useCallback(
    (event: DragEndEvent) => {
      setState((prev) => {
        const next = applyEventDragEnd(prev, event);
        return next ?? prev;
      });
    },
    [setState],
  );
}
