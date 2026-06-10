import type { MutableRefObject } from 'react';

export type EventSyncMode = 'local' | 'cloud';

export type EventSyncRefs = {
  skipSaveRef: MutableRefObject<boolean>;
  saveTimerRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
  lastSentJsonRef: MutableRefObject<string | null>;
  clearSaveTimer: () => void;
};
