import { createContext, type PropsWithChildren, useContext } from 'react';
import type { Guest } from '../../../state/types';

export type SeatingInteractions = {
  landKeyForGuestId: (guestId: string) => number;
  onEditGuest: (guest: Guest) => void;
  onOpenAddGuest: () => void;
};

const SeatingInteractionsContext = createContext<SeatingInteractions | null>(null);

export function SeatingInteractionsProvider({
  value,
  children,
}: PropsWithChildren<{ value: SeatingInteractions }>) {
  return (
    <SeatingInteractionsContext.Provider value={value}>
      {children}
    </SeatingInteractionsContext.Provider>
  );
}

export function useSeatingInteractions(): SeatingInteractions {
  const ctx = useContext(SeatingInteractionsContext);
  if (!ctx) {
    throw new Error('useSeatingInteractions must be used within SeatingInteractionsProvider');
  }
  return ctx;
}
