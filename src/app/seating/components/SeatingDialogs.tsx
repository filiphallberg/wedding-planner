import { AddGuestDialog } from '../../../components/AddGuestDialog';
import { GuestEditModal } from '../../../components/GuestEditModal';
import { TableFormDialog } from '../../../components/TableFormDialog';
import { useEventStateContext } from '../../../state/context/EventStateContext';
import { useSeatingUIContext } from '../context/SeatingUIContext';

export function SeatingDialogs() {
  const { addGuest, addTable, updateTable, removeTable, updateGuest, removeGuest } =
    useEventStateContext();
  const { dialogs, tableEditorState } = useSeatingUIContext();
  const { tableEditor, tableFormSnapshot, closeTableEditor } = tableEditorState;

  return (
    <>
      <AddGuestDialog
        open={dialogs.addGuestOpen}
        onClose={dialogs.closeAddGuest}
        onAdd={(name, note) => addGuest(name, note)}
      />
      <TableFormDialog
        open={tableEditor !== null && tableFormSnapshot !== null}
        onClose={closeTableEditor}
        editingTableId={tableEditor?.mode === 'edit' ? tableEditor.tableId : null}
        initial={tableFormSnapshot}
        onAdd={(s) =>
          addTable(s.label, { seatCount: s.seatCount, shape: s.shape, paletteId: s.paletteId })
        }
        onUpdate={(id, s) =>
          updateTable(id, {
            label: s.label,
            seatCount: s.seatCount,
            shape: s.shape,
            paletteId: s.paletteId,
          })
        }
        onRemove={removeTable}
      />
      {dialogs.editingGuest ? (
        <GuestEditModal
          key={dialogs.editingGuest.id}
          guest={dialogs.editingGuest}
          onClose={() => dialogs.setEditingGuest(null)}
          onSave={(guestId, patch) => {
            updateGuest(guestId, {
              name: patch.name,
              specialNeedsNote: patch.specialNeedsNote,
            });
          }}
          onRemove={removeGuest}
        />
      ) : null}
    </>
  );
}
