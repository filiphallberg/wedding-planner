import type { Dispatch, SetStateAction } from 'react';
import { useRealtime } from '../../realtime/client';
import { parseEventState } from '../eventStateCodec';
import type { EventState } from '../types';
import type { EventSyncMode, EventSyncRefs } from './types';

type Options = {
  projectId: string | null;
  sync: EventSyncMode;
  hydrated: boolean;
  setState: Dispatch<SetStateAction<EventState>>;
  refs: EventSyncRefs;
};

export function useEventRealtimeSync({ projectId, sync, hydrated, setState, refs }: Options) {
  const { skipSaveRef, lastSentJsonRef } = refs;

  useRealtime({
    channels: projectId && sync === 'cloud' ? [`project:${projectId}`] : [],
    enabled: Boolean(projectId && sync === 'cloud' && hydrated),
    onData: (payload) => {
      const data = payload.data as { stateJson?: string };
      const stateJson = data?.stateJson;
      if (typeof stateJson !== 'string') return;
      const parsed = parseEventState(JSON.parse(stateJson));
      if (!parsed) return;
      const incoming = JSON.stringify(parsed);
      if (incoming === lastSentJsonRef.current) return;
      skipSaveRef.current = true;
      lastSentJsonRef.current = incoming;
      setState(parsed);
    },
  });
}
