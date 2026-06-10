import { useSeatingInteractions } from '../app/seating/context/SeatingInteractionsContext';
import { tableVariantSlots } from '../lib/tablePaletteVariants';
import { useEventStateContext } from '../state/context/EventStateContext';
import { droppableSeat } from '../state/utils/droppables';
import { Seat } from './seat';

type TableProps = {
  tableId: string;
  onOpenTableSetup: () => void;
};

export function Table({ tableId, onOpenTableSetup }: TableProps) {
  const { state, seatsForTable, tableOccupancy } = useEventStateContext();
  const { landKeyForGuestId, onEditGuest } = useSeatingInteractions();

  const table = state.tables.find((t) => t.id === tableId);

  if (!table) return null;

  const { shape, paletteId, seatCount } = table;

  const seats = seatsForTable(tableId);
  const occupancy = tableOccupancy(tableId);
  const full = occupancy >= seatCount;
  const fillPct = seatCount > 0 ? Math.round((occupancy / seatCount) * 100) : 0;
  const slots = tableVariantSlots(shape, paletteId);

  return (
    <article className={slots.base()}>
      <header className={slots.header()}>
        <div>
          <h3 className={slots.heading()}>{table.label}</h3>
          <div className="mt-2 flex items-center gap-2">
            <div className="h-0.5 w-20 overflow-hidden rounded-full bg-black/10">
              <div className={slots.fill()} style={{ width: `${fillPct}%` }} />
            </div>
            <p className={slots.details()}>
              {occupancy}/{seatCount}
              {full ? <span className={slots.indicator()}>· Full</span> : null}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenTableSetup}
          aria-label={`Table setup for ${table.label}`}
          className={slots.action()}
        >
          Setup
        </button>
      </header>
      <div className={slots.body()}>
        <div className={slots.table()}>
          {seats.map((seatGuest, index) => (
            <Seat
              key={droppableSeat(tableId, index)}
              tableId={tableId}
              seatIndex={index}
              guest={seatGuest}
              shape={shape}
              seatCount={seatCount}
              landKey={seatGuest ? landKeyForGuestId(seatGuest.id) : 0}
              onEditGuest={seatGuest ? () => onEditGuest(seatGuest) : undefined}
            />
          ))}
        </div>
      </div>
    </article>
  );
}
