import { PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';

/** Pointer events for mouse/pen only — touch is handled by TouchSensor. */
class MousePointerSensor extends PointerSensor {
  static activators = [
    {
      eventName: 'onPointerDown' as const,
      handler: ({ nativeEvent: event }: { nativeEvent: PointerEvent }) => {
        if (event.pointerType === 'touch') return false;
        return true;
      },
    },
  ];
}

export function useDndSensors() {
  return useSensors(
    useSensor(MousePointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
  );
}
