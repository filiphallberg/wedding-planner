import { useEffect, useState } from 'react';
import { Button, Dialog, Field, Input, Textarea } from '../ui';

type Props = {
  open: boolean;
  onClose: () => void;
  onAdd: (name: string, specialNeedsNote: string) => void;
};

export function AddGuestDialog({ open, onClose, onAdd }: Props) {
  const [name, setName] = useState('');
  const [specialNeedsNote, setSpecialNeedsNote] = useState('');

  useEffect(() => {
    if (!open) {
      queueMicrotask(() => {
        setName('');
        setSpecialNeedsNote('');
      });
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} title="Add guest" titleId="add-guest-title">
      <form
        className="mt-4 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const trimmed = name.trim();
          if (!trimmed) return;
          onAdd(trimmed, specialNeedsNote);
          onClose();
        }}
      >
        <Field id="add-guest-name" label="Name">
          <Input
            id="add-guest-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Guest name"
            autoFocus
          />
        </Field>
        <Field id="add-guest-needs" label="Dietary / special needs (optional)">
          <Textarea
            id="add-guest-needs"
            value={specialNeedsNote}
            onChange={(e) => setSpecialNeedsNote(e.target.value)}
            rows={3}
            placeholder="e.g. vegetarian, nut allergy, wheelchair access"
          />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="default">
            Add guest
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
