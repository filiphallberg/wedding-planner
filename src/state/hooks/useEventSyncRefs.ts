import { useCallback, useRef } from 'react';
import type { EventSyncRefs } from './types';

export function useEventSyncRefs(): EventSyncRefs {
  const skipSaveRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSentJsonRef = useRef<string | null>(null);

  const clearSaveTimer = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
  }, []);

  return { skipSaveRef, saveTimerRef, lastSentJsonRef, clearSaveTimer };
}
