import { useCallback, useState } from 'react';

export function useGuestLandKeys() {
  const [guestLandKeys, setGuestLandKeys] = useState<Record<string, number>>({});

  const landKeyForGuestId = useCallback(
    (guestId: string) => guestLandKeys[guestId] ?? 0,
    [guestLandKeys],
  );

  const recordGuestLandings = useCallback((guestIds: string[]) => {
    if (guestIds.length === 0) return;
    setGuestLandKeys((prev) => {
      const next = { ...prev };
      for (const id of guestIds) {
        next[id] = (next[id] ?? 0) + 1;
      }
      return next;
    });
  }, []);

  return { landKeyForGuestId, recordGuestLandings };
}
