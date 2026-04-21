import { useMemo } from 'react';
import { getTablePalette, getTableShapeShell, type TablePaletteId } from '../lib/tablePalettes';
import type { TableShape } from '../lib/tableShapes';
import type { Guest } from '../state/types';
import { Button } from '../ui';
import { SeatSlot } from './SeatSlot';

type Props = {
  tableId: string;
  label: string;
  paletteId: TablePaletteId;
  seatCount: number;
  shape: TableShape;
  seats: (Guest | null)[];
  occupancy: number;
  onUnseatGuest: (id: string) => void;
  onEditGuest: (guest: Guest) => void;
  landKeyForGuestId: (guestId: string) => number;
  onOpenTableSetup: () => void;
};

export function TableCard({
  tableId,
  label,
  paletteId,
  seatCount,
  shape,
  seats,
  occupancy,
  onUnseatGuest,
  onEditGuest,
  landKeyForGuestId,
  onOpenTableSetup,
}: Props) {
  const full = occupancy >= seatCount;
  const palette = getTablePalette(paletteId);
  const shell = getTableShapeShell(shape, palette);

  const seatIndices = useMemo(() => Array.from({ length: seatCount }, (_, i) => i), [seatCount]);

  return (
    <article className={`flex flex-col rounded-lg border ${palette.card}`}>
      <header
        className={`flex flex-wrap items-center justify-between gap-3 border-b px-3 py-2.5 ${palette.header}`}
      >
        <div className="min-w-0">
          <h3 className={`text-sm font-semibold tracking-tight ${palette.title}`}>{label}</h3>
          <p className={`text-xs ${palette.meta}`}>
            {occupancy}/{seatCount}
            {full ? (
              <span className={`ml-1 font-medium ${palette.metaEmphasis}`}>· Full</span>
            ) : null}
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="shrink-0 px-2.5 py-1.5 text-xs"
          onClick={onOpenTableSetup}
        >
          Table setup
        </Button>
      </header>

      <div
        className={`relative mx-auto w-full max-w-[min(100%,440px)] p-5 sm:p-6 ${palette.body} ${shell.aspect}`}
      >
        <div className={`absolute inset-0 ${shell.outer}`} aria-hidden />
        <div className={shell.inner} aria-hidden />

        {seatIndices.map((i) => (
          <SeatSlot
            key={i}
            tableId={tableId}
            seatIndex={i}
            guest={seats[i] ?? null}
            shape={shape}
            seatCount={seatCount}
            onUnseatGuest={onUnseatGuest}
            onEditGuest={onEditGuest}
            landKeyForGuestId={landKeyForGuestId}
          />
        ))}
      </div>
    </article>
  );
}
