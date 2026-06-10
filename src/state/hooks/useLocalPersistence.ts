import { useEffect } from 'react';
import { saveLocalProjectState } from '../localProjectStorage';
import type { EventState } from '../types';
import type { EventSyncMode, EventSyncRefs } from './types';

export function useLocalPersistence(
  sync: EventSyncMode,
  projectId: string | null,
  state: EventState,
  hydrated: boolean,
  refs: EventSyncRefs,
) {
  const { skipSaveRef, lastSentJsonRef } = refs;

  useEffect(() => {
    if (sync !== 'local' || !projectId || !hydrated) return;
    if (skipSaveRef.current) {
      skipSaveRef.current = false;
      return;
    }

    const json = JSON.stringify(state);
    if (json === lastSentJsonRef.current) return;

    saveLocalProjectState(projectId, state);
    lastSentJsonRef.current = json;
  }, [sync, projectId, state, hydrated, skipSaveRef, lastSentJsonRef]);
}
