import { type Dispatch, type SetStateAction, useEffect, useState } from 'react';
import { getProjectApi } from '../../sync/projectApi';
import { emptyState } from '../eventStateCodec';
import { loadLocalProjectState } from '../localProjectStorage';
import type { EventState } from '../types';
import type { EventSyncMode, EventSyncRefs } from './types';

type Options = {
  projectId: string | null;
  sync: EventSyncMode;
  refs: EventSyncRefs;
};

export function useEventHydration({ projectId, sync, refs }: Options) {
  const { skipSaveRef, lastSentJsonRef, clearSaveTimer } = refs;
  const [state, setState] = useState<EventState>(() => emptyState());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    clearSaveTimer();
    skipSaveRef.current = true;
    setHydrated(false);

    if (!projectId) {
      setState(emptyState());
      setHydrated(true);
      lastSentJsonRef.current = null;
      return;
    }

    if (sync === 'local') {
      const loaded = loadLocalProjectState(projectId) ?? emptyState();
      setState(loaded);
      lastSentJsonRef.current = JSON.stringify(loaded);
      setHydrated(true);
      skipSaveRef.current = false;
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const { state: remote } = await getProjectApi(projectId);
        if (cancelled) return;
        setState(remote);
        lastSentJsonRef.current = JSON.stringify(remote);
      } catch {
        if (!cancelled) setState(emptyState());
      } finally {
        if (!cancelled) {
          setHydrated(true);
          skipSaveRef.current = true;
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projectId, sync, clearSaveTimer]);

  return {
    state,
    setState: setState as Dispatch<SetStateAction<EventState>>,
    hydrated,
  };
}
