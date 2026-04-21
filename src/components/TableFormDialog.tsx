import { useEffect, useLayoutEffect, useState } from 'react';
import {
  DEFAULT_TABLE_PALETTE_ID,
  getTablePalette,
  isTablePaletteId,
  TABLE_PALETTE_OPTIONS,
  type TablePaletteId,
} from '../lib/tablePalettes';
import { SHAPE_LABELS, TABLE_SHAPES, type TableShape } from '../lib/tableShapes';
import { DEFAULT_SEAT_COUNT, MAX_SEATS_PER_TABLE } from '../state/constants';
import { Button, Dialog, Field, Input, SelectMenu } from '../ui';

const shapeOptions = TABLE_SHAPES.map((id) => ({
  value: id,
  label: SHAPE_LABELS[id],
}));

const paletteSelectOptions = TABLE_PALETTE_OPTIONS.map(({ id, label: optLabel }) => ({
  value: id,
  label: optLabel,
}));

export type TableFormSnapshot = {
  label: string;
  seatCount: number;
  shape: TableShape;
  paletteId: TablePaletteId;
};

type Props = {
  open: boolean;
  onClose: () => void;
  /** `null` = add a new table; otherwise edit that table. */
  editingTableId: string | null;
  /** Seeds local fields whenever `open` becomes true. */
  initial: TableFormSnapshot | null;
  onAdd: (snapshot: TableFormSnapshot) => void;
  onUpdate: (tableId: string, snapshot: TableFormSnapshot) => void;
  onRemove: (tableId: string) => void;
};

export function TableFormDialog({
  open,
  onClose,
  editingTableId,
  initial,
  onAdd,
  onUpdate,
  onRemove,
}: Props) {
  /** Kept while `open` animates out so edit chrome (e.g. Remove) does not jump before the dialog closes. */
  const [surfaceEditTableId, setSurfaceEditTableId] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [seatCount, setSeatCount] = useState(DEFAULT_SEAT_COUNT);
  const [shape, setShape] = useState<TableShape>('oval');
  const [paletteId, setPaletteId] = useState<TablePaletteId>(DEFAULT_TABLE_PALETTE_ID);

  useLayoutEffect(() => {
    if (open) {
      setSurfaceEditTableId(editingTableId);
    }
  }, [open, editingTableId]);

  useEffect(() => {
    if (!open || !initial) return;
    setLabel(initial.label);
    setSeatCount(initial.seatCount);
    setShape(initial.shape);
    setPaletteId(initial.paletteId);
  }, [open, initial?.label, initial?.seatCount, initial?.shape, initial?.paletteId]);

  const palette = getTablePalette(paletteId);

  const submit = () => {
    const trimmed = label.trim();
    if (!trimmed) return;
    const payload: TableFormSnapshot = {
      label: trimmed,
      seatCount,
      shape,
      paletteId,
    };
    if (editingTableId) {
      onUpdate(editingTableId, payload);
    } else {
      onAdd(payload);
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={surfaceEditTableId ? 'Table setup' : 'Add table'}
      titleId="table-form-dialog-title"
      panelMaxWidthClass="max-w-sm"
    >
      <form
        className="mt-4 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <Field id="table-form-label" label="Table name">
          <Input
            id="table-form-label"
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Table name"
            autoFocus
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field id="table-form-seats" label="Seats">
            <Input
              id="table-form-seats"
              type="number"
              min={1}
              max={MAX_SEATS_PER_TABLE}
              value={seatCount}
              onChange={(e) => {
                const v = Number.parseInt(e.target.value, 10);
                if (!Number.isFinite(v)) return;
                setSeatCount(v);
              }}
            />
          </Field>
          <div>
            <span className="mb-1 block text-xs font-medium text-stone-600">Shape</span>
            <SelectMenu
              aria-label="Table shape"
              value={shape}
              onChange={(v) => setShape(v)}
              options={shapeOptions}
              className="w-full"
              summaryClassName="w-full justify-between"
            />
          </div>
        </div>
        <div>
          <span className="mb-1 block text-xs font-medium text-stone-700">
            Color ({palette.label})
          </span>
          <div className="flex items-center gap-2">
            <div
              className="relative size-8 shrink-0 rounded-full ring-1 ring-stone-200"
              aria-hidden
            >
              <div
                className={`pointer-events-none absolute inset-0 rounded-full ${palette.swatch}`}
              />
            </div>
            <SelectMenu
              aria-label="Table color"
              value={paletteId}
              onChange={(v) => {
                if (isTablePaletteId(v)) setPaletteId(v);
              }}
              options={paletteSelectOptions}
              className="min-w-0 flex-1"
              summaryClassName="w-full min-w-0 justify-between py-2 text-sm"
            />
          </div>
        </div>
        {surfaceEditTableId ? (
          <Button
            type="button"
            variant="secondary"
            className="w-full border-rose-200 bg-rose-50/80 text-rose-800 hover:bg-rose-100"
            onClick={() => {
              onRemove(surfaceEditTableId);
              onClose();
            }}
          >
            Remove table
          </Button>
        ) : null}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            {surfaceEditTableId ? 'Save' : 'Add table'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
