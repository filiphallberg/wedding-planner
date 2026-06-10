import { useEventStateContext } from '../../../state/context/EventStateContext';
import { Button } from '../../../ui';
import { useProjectControlsContext } from '../context/ProjectControlsContext';
import { ProjectSwitcherMenu } from './ProjectSwitcherMenu';

export function SeatingHeader() {
  const { onOpenInvite, userSlot } = useProjectControlsContext();
  const { state } = useEventStateContext();

  return (
    <header className="shrink-0 border-b border-stone-200/70 bg-white px-3 py-3 sm:px-6 sm:py-6">
      <div className="flex items-center justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <ProjectSwitcherMenu />

          {onOpenInvite ? (
            <Button type="button" variant="secondary" onClick={onOpenInvite}>
              Invite
            </Button>
          ) : null}

          <Button
            type="button"
            variant="secondary"
            onClick={async () => {
              const { downloadSeatingPdf } = await import('../../../export/seatingPdf');
              downloadSeatingPdf(state);
            }}
          >
            Export
          </Button>
        </div>

        <div className="flex shrink-0 items-center sm:justify-end">{userSlot}</div>
      </div>
    </header>
  );
}
