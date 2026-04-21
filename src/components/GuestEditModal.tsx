import { useState } from 'react';
import type { Guest } from '../state/types';
import { Button, Dialog, Field, Input, Textarea } from '../ui';

type Props = {
  guest: Guest;
  onClose: () => void;
  onSave: (guestId: string, patch: { name: string; specialNeedsNote: string }) => void;
};

export function GuestEditModal({ guest, onClose, onSave }: Props) {
  const [name, setName] = useState(guest.name);
  const [specialNeedsNote, setSpecialNeedsNote] = useState(guest.specialNeedsNote);

  return (
    <Dialog open onClose={onClose} title="Edit guest" titleId="guest-edit-title">
      <form
        className="mt-4 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const trimmed = name.trim();
          if (!trimmed) return;
          onSave(guest.id, { name: trimmed, specialNeedsNote });
          onClose();
        }}
      >
        <Field id="edit-name" label="Name">
          <Input
            id="edit-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </Field>
        <Field id="edit-needs" label="Dietary / special needs (optional)">
          <Textarea
            id="edit-needs"
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
            Save
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
