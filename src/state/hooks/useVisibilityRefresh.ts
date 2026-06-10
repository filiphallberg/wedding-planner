import type { Dispatch, SetStateAction } from 'react';
import { useEffect } from 'react';
import { getProjectApi } from '../../sync/projectApi';
import type { EventState } from '../types';
import type { EventSyncMode, EventSyncRefs } from './types';

type Options = {
  sync: EventSyncMode;
  projectId: string | null;
  hydrated: boolean;
  setState: Dispatch<SetStateAction<EventState>>;
  refs: EventSyncRefs;
};

export function useVisibilityRefresh({ sync, projectId, hydrated, setState, refs }: Options) {
  const { saveTimerRef, lastSentJsonRef, skipSaveRef } = refs;

  useEffect(() => {
    if (sync !== 'cloud' || !projectId || !hydrated) return;
    const onVis = () => {
      if (document.visibilityState !== 'visible') return;
      if (saveTimerRef.current !== null) return;
      void (async () => {
        try {
          const { state: remote } = await getProjectApi(projectId);
          const incoming = JSON.stringify(remote);
          setState((prev) => {
            if (JSON.stringify(prev) !== lastSentJsonRef.current) return prev;
            if (incoming === lastSentJsonRef.current) return prev;
            lastSentJsonRef.current = incoming;
            skipSaveRef.current = true;
            return remote;
          });
        } catch {
          /* ignore */
        }
      })();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [sync, projectId, hydrated, setState]);
}
