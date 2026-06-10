import { createContext, type PropsWithChildren, useContext, useMemo } from 'react';
import { useEventStateContext } from '../../../state/context/EventStateContext';
import { useSeatingLayoutController } from '../hooks/useSeatingLayoutController';
import { useProjectControlsContext } from './ProjectControlsContext';
import {
  type SeatingInteractions,
  SeatingInteractionsProvider,
} from './SeatingInteractionsContext';

export type SeatingUIContextValue = ReturnType<typeof useSeatingLayoutController>;

const SeatingUIContext = createContext<SeatingUIContextValue | null>(null);

export function SeatingUIProvider({ children }: PropsWithChildren) {
  const eventState = useEventStateContext();
  const projectControls = useProjectControlsContext();
  const value = useSeatingLayoutController(projectControls, eventState);

  const interactions = useMemo<SeatingInteractions>(
    () => ({
      onEditGuest: value.dialogs.setEditingGuest,
      onOpenAddGuest: value.dialogs.openAddGuest,
    }),
    [value.dialogs.setEditingGuest, value.dialogs.openAddGuest],
  );

  return (
    <SeatingInteractionsProvider value={interactions}>
      <SeatingUIContext.Provider value={value}>{children}</SeatingUIContext.Provider>
    </SeatingInteractionsProvider>
  );
}

export function useSeatingUIContext(): SeatingUIContextValue {
  const ctx = useContext(SeatingUIContext);
  if (!ctx) {
    throw new Error('useSeatingUIContext must be used within SeatingUIProvider');
  }
  return ctx;
}
