import type { EventSyncMode } from './types';
import { useCloudSave } from './useCloudSave';
import { useDragEndHandler } from './useDragEndHandler';
import { useEventHydration } from './useEventHydration';
import { useEventRealtimeSync } from './useEventRealtimeSync';
import { useEventSelectors } from './useEventSelectors';
import { useEventSyncRefs } from './useEventSyncRefs';
import { useGuestActions } from './useGuestActions';
import { useLocalPersistence } from './useLocalPersistence';
import { useTableActions } from './useTableActions';
import { useVisibilityRefresh } from './useVisibilityRefresh';

export type { EventSyncMode } from './types';

export function useEventState(opts: { projectId: string | null; sync: EventSyncMode }) {
  const { projectId, sync } = opts;
  const refs = useEventSyncRefs();
  const { state, setState, hydrated } = useEventHydration({ projectId, sync, refs });

  useLocalPersistence(sync, projectId, state, hydrated, refs);
  useCloudSave({ sync, projectId, state, hydrated, refs });
  useEventRealtimeSync({ projectId, sync, hydrated, setState, refs });
  useVisibilityRefresh({ sync, projectId, hydrated, setState, refs });

  const guestActions = useGuestActions(setState);
  const tableActions = useTableActions(setState);
  const selectors = useEventSelectors(state);
  const handleDragEnd = useDragEndHandler(setState);

  return {
    state,
    hydrated,
    ...guestActions,
    ...tableActions,
    handleDragEnd,
    ...selectors,
  };
}

export type LayoutEvent = ReturnType<typeof useEventState>;
