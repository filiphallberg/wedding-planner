import { createRealtime } from '@upstash/realtime/client'

/** Matches `shared/realtimeSchema.ts` / Worker `Realtime` schema. */
export type SeatingRealtimeEvents = {
  seating: {
    updated: {
      stateJson: string
    }
  }
}

export const { useRealtime } = createRealtime<SeatingRealtimeEvents>()
