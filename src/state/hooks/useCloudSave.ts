import { useCallback, useEffect } from 'react';
import { saveProjectApi } from '../../sync/projectApi';
import type { EventState } from '../types';
import type { EventSyncMode, EventSyncRefs } from './types';

const SAVE_DEBOUNCE_MS = 450;

type Options = {
  sync: EventSyncMode;
  projectId: string | null;
  state: EventState;
  hydrated: boolean;
  refs: EventSyncRefs;
};

export function useCloudSave({ sync, projectId, state, hydrated, refs }: Options) {
  const { skipSaveRef, saveTimerRef, lastSentJsonRef, clearSaveTimer } = refs;

  const scheduleCloudSave = useCallback(
    (next: EventState) => {
      if (sync !== 'cloud' || !projectId) return;
      const json = JSON.stringify(next);
      if (json === lastSentJsonRef.current) return;
      clearSaveTimer();
      saveTimerRef.current = setTimeout(() => {
        saveTimerRef.current = null;
        void (async () => {
          try {
            await saveProjectApi(projectId, next);
            lastSentJsonRef.current = json;
          } catch {
            /* retry on next edit */
          }
        })();
      }, SAVE_DEBOUNCE_MS);
    },
    [sync, projectId, clearSaveTimer],
  );

  useEffect(() => {
    if (!hydrated || sync !== 'cloud' || !projectId) return;
    if (skipSaveRef.current) {
      skipSaveRef.current = false;
      return;
    }
    scheduleCloudSave(state);
    return () => clearSaveTimer();
  }, [state, hydrated, sync, projectId, scheduleCloudSave, clearSaveTimer]);

  return { scheduleCloudSave };
}
