import { Table } from '../../../components/table';
import { Button } from '../../../ui';
import { cn } from '../../../utils';
import { useSeatingUIContext } from '../context/SeatingUIContext';

export function SeatingTablesSection() {
  const { sortedTables, mainScrollRef, tableEditorState } = useSeatingUIContext();

  return (
    <main
      ref={mainScrollRef}
      className={cn('min-h-0 flex-1 overflow-y-auto overscroll-contain', 'p-3 sm:p-6')}
    >
      <section className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-xs font-bold tracking-wider text-stone-600 uppercase">
              Tables
            </span>
            <span className="font-display text-2xl font-bold text-stone-900">
              {sortedTables.length}
            </span>
          </div>
          <Button
            type="button"
            variant="primary"
            className="shrink-0"
            onClick={tableEditorState.openAddTable}
          >
            + Add table
          </Button>
        </div>

        {sortedTables.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-28 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-stone-200">
              <div className="h-2.5 w-2.5 rounded-full bg-stone-300" />
            </div>
            <div>
              <p className="font-display text-xl font-bold text-stone-400">No tables yet</p>
              <p className="mt-2 text-sm font-medium text-stone-500">
                Add your first table to begin
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-flow-row-dense grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
            {sortedTables.map((t) => (
              <div key={t.id} className={cn(t.shape === 'rectangle' && 'col-span-full')}>
                <Table
                  tableId={t.id}
                  onOpenTableSetup={() => tableEditorState.openEditTable(t.id)}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
