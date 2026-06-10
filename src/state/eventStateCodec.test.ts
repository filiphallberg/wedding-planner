import { describe, expect, test } from 'bun:test';
import { emptyState, parseEventState } from './eventStateCodec';

describe('parseEventState', () => {
  test('returns null for invalid input', () => {
    expect(parseEventState(null)).toBeNull();
    expect(parseEventState({})).toBeNull();
    expect(parseEventState({ version: 99, guests: [], tables: [], assignments: {} })).toBeNull();
  });

  test('parses v3 state', () => {
    const parsed = parseEventState({
      version: 3,
      guests: [{ id: 'g1', name: 'Ada', specialNeedsNote: 'Vegan' }],
      tables: [{ id: 't1', label: 'Table 1', paletteId: 'rose', seatCount: 8, shape: 'oval' }],
      assignments: { g1: { tableId: 't1', seatIndex: 2 } },
    });

    expect(parsed).toEqual({
      version: 3,
      guests: [{ id: 'g1', name: 'Ada', specialNeedsNote: 'Vegan' }],
      tables: [{ id: 't1', label: 'Table 1', paletteId: 'rose', seatCount: 8, shape: 'oval' }],
      assignments: { g1: { tableId: 't1', seatIndex: 2 } },
    });
  });

  test('migrates v2 table-only assignments to v3 seat assignments', () => {
    const parsed = parseEventState({
      version: 2,
      guests: [
        { id: 'g1', name: 'Zoe' },
        { id: 'g2', name: 'Amy' },
      ],
      tables: [{ id: 't1', label: 'Main', paletteId: 'stone', seatCount: 8, shape: 'round' }],
      assignments: { g1: 't1', g2: 't1' },
    });

    expect(parsed?.version).toBe(3);
    expect(parsed?.assignments.g2).toEqual({ tableId: 't1', seatIndex: 0 });
    expect(parsed?.assignments.g1).toEqual({ tableId: 't1', seatIndex: 1 });
  });

  test('migrates legacy hasSpecialNeeds to specialNeedsNote', () => {
    const parsed = parseEventState({
      version: 3,
      guests: [{ id: 'g1', name: 'Sam', hasSpecialNeeds: true }],
      tables: [],
      assignments: { g1: null },
    });

    expect(parsed?.guests[0]?.specialNeedsNote).toBe('Special needs');
  });

  test('falls back unknown palette and invalid seats', () => {
    const parsed = parseEventState({
      version: 3,
      guests: [{ id: 'g1', name: 'Pat' }],
      tables: [{ id: 't1', label: 'T', paletteId: 'not-a-color', seatCount: 4, shape: 'oval' }],
      assignments: { g1: { tableId: 't1', seatIndex: 9 } },
    });

    expect(parsed?.tables[0]?.paletteId).toBe('stone');
    expect(parsed?.assignments.g1).toBeNull();
  });

  test('emptyState is valid v3', () => {
    expect(parseEventState(emptyState())).toEqual(emptyState());
  });
});
