import { useDroppable } from '@dnd-kit/core';
import type { ComponentProps } from 'react';
import { tv } from 'tailwind-variants';
import { seatPositionForShape } from '../lib/seatPositions';
import type { TableShape } from '../state/tableShape';
import type { Guest } from '../state/types';
import { droppableSeat } from '../state/utils/droppables';
import Chip from './chip';

const seatVariants = tv({
  base: 'flex min-h-12 min-w-24 max-w-36 flex-col items-center justify-center rounded-xl transition-all duration-200',
  variants: {
    hover: {
      true: '',
      false: '',
    },
    guest: {
      true: '',
      false: 'border border-dashed border-stone-300 bg-white/50 seat-breathe',
    },
  },
  compoundVariants: [
    {
      guest: true,
      hover: true,
      className: 'ring-1 ring-stone-400 ring-offset-1 ring-offset-white',
    },
    {
      guest: true,
      hover: false,
      className: '',
    },
    {
      guest: false,
      hover: true,
      className: 'border-stone-500 bg-stone-100 shadow-none',
    },
    {
      guest: false,
      hover: false,
      className: 'hover:border-stone-400 hover:bg-white',
    },
  ],
});

type SeatProps = ComponentProps<'div'> & {
  tableId: string;
  seatIndex: number;
  guest: Guest | null;
  shape: TableShape;
  seatCount: number;
  aspectRatio?: number;
};

export function Seat({
  tableId,
  seatIndex,
  guest,
  shape,
  seatCount,
  aspectRatio,
  className,
  ...props
}: SeatProps) {
  const id = droppableSeat(tableId, seatIndex);
  const { setNodeRef, isOver } = useDroppable({ id });
  const { left, top } = seatPositionForShape(seatIndex, seatCount, shape, aspectRatio);

  return (
    <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left, top }} {...props}>
      <div
        ref={setNodeRef}
        className={seatVariants({ hover: isOver, guest: Boolean(guest), className })}
        aria-label={guest ? `Seat ${seatIndex + 1}, ${guest.name}` : `Empty seat ${seatIndex + 1}`}
      >
        {guest ? <Chip guest={guest} /> : <span className="sr-only">Empty seat</span>}
      </div>
    </div>
  );
}
