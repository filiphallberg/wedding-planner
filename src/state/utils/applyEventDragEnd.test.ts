import { describe, expect, test } from 'bun:test';
import type { DragEndEvent } from '@dnd-kit/core';
import type { EventState } from '../types';
import { applyEventDragEnd } from './applyEventDragEnd';
import { droppableSeat, droppableUnassigned } from './droppables';

function dragEnd(activeId: string, overId: string): DragEndEvent {
  return {
    active: { id: activeId },
    over: { id: overId },
  } as DragEndEvent;
}

const baseState: EventState = {
  version: 3,
  guests: [
    { id: 'g1', name: 'Ada', specialNeedsNote: '' },
    { id: 'g2', name: 'Bob', specialNeedsNote: '' },
  ],
  tables: [{ id: 't1', label: 'Table 1', paletteId: 'stone', seatCount: 4, shape: 'oval' }],
  assignments: {
    g1: { tableId: 't1', seatIndex: 0 },
    g2: null,
  },
};

describe('applyEventDragEnd', () => {
  test('returns null when dropped outside a target', () => {
    expect(applyEventDragEnd(baseState, dragEnd('g1', 'nowhere'))).toBeNull();
  });

  test('unassigns a guest', () => {
    const result = applyEventDragEnd(baseState, dragEnd('g1', droppableUnassigned()));
    expect(result?.assignments.g1).toBeNull();
  });

  test('assigns a guest to an empty seat', () => {
    const result = applyEventDragEnd(baseState, dragEnd('g2', droppableSeat('t1', 1)));
    expect(result?.assignments.g2).toEqual({ tableId: 't1', seatIndex: 1 });
  });

  test('swaps guests when dropping on an occupied seat', () => {
    const seated: EventState = {
      ...baseState,
      assignments: {
        g1: { tableId: 't1', seatIndex: 0 },
        g2: { tableId: 't1', seatIndex: 1 },
      },
    };

    const result = applyEventDragEnd(seated, dragEnd('g2', droppableSeat('t1', 0)));
    expect(result?.assignments.g1).toEqual({ tableId: 't1', seatIndex: 1 });
    expect(result?.assignments.g2).toEqual({ tableId: 't1', seatIndex: 0 });
  });
});
