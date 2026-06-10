import { createContext, type PropsWithChildren, useContext } from 'react';
import { type EventSyncMode, type LayoutEvent, useEventState } from '../hooks/useEventState';

const EventStateContext = createContext<LayoutEvent | null>(null);

type EventStateProviderProps = PropsWithChildren<{
  projectId: string | null;
  sync: EventSyncMode;
}>;

export function EventStateProvider({ projectId, sync, children }: EventStateProviderProps) {
  const value = useEventState({ projectId, sync });
  return <EventStateContext.Provider value={value}>{children}</EventStateContext.Provider>;
}

export function useEventStateContext(): LayoutEvent {
  const ctx = useContext(EventStateContext);
  if (!ctx) {
    throw new Error('useEventStateContext must be used within EventStateProvider');
  }
  return ctx;
}
