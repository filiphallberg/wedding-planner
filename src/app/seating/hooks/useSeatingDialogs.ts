import { useState } from 'react';
import type { Guest } from '../../../state/types';

export function useSeatingDialogs() {
  const [addGuestOpen, setAddGuestOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);

  return {
    addGuestOpen,
    openAddGuest: () => setAddGuestOpen(true),
    closeAddGuest: () => setAddGuestOpen(false),
    editingGuest,
    setEditingGuest,
  };
}
