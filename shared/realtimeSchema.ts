import * as z from 'zod/v4'

/** Shared between Worker (Realtime + emit) and client (typed useRealtime). */
export const seatingRealtimeSchema = {
  seating: {
    updated: z.object({
      stateJson: z.string(),
    }),
  },
} as const
