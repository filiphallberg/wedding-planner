import { Plus } from 'lucide-react';
import { MenuDisclosure, MenuRow, MenuSectionTitle } from '../../../ui';
import { cn } from '../../../utils';
import { useProjectControlsContext } from '../context/ProjectControlsContext';
import { useSeatingUIContext } from '../context/SeatingUIContext';

export function ProjectSwitcherMenu() {
  const {
    projectId,
    projects,
    onSelectProject,
    onNewProject,
    onRenameProject,
    canRenameProject = true,
  } = useProjectControlsContext();
  const { projectMenuLabel } = useSeatingUIContext();

  return (
    <MenuDisclosure
      label={projectMenuLabel}
      align="start"
      summaryClassName="max-w-[min(100%,18rem)]"
    >
      <MenuSectionTitle>Projects</MenuSectionTitle>
      {projects.map((p) => {
        const active = p.id === projectId;
        return (
          <div
            key={p.id}
            className={cn(
              'flex w-full items-center gap-0.5 rounded-xl p-0.5',
              active ? 'bg-stone-100' : 'hover:bg-stone-50',
            )}
          >
            <button
              type="button"
              className={cn(
                'min-w-0 flex-1 cursor-pointer rounded-xl px-3 py-2.5 text-left text-sm transition-colors',
                active ? 'font-semibold text-stone-900' : 'font-medium text-stone-700',
              )}
              onClick={(e) => {
                onSelectProject(p.id);
                (e.currentTarget.closest('details') as HTMLDetailsElement | null)?.removeAttribute(
                  'open',
                );
              }}
            >
              <span className="truncate">
                {p.name}
                {p.role === 'member' ? ' (shared)' : ''}
              </span>
            </button>
            {canRenameProject && active ? (
              <button
                type="button"
                className="shrink-0 cursor-pointer rounded-lg px-2.5 py-1.5 text-xs font-semibold text-stone-500 hover:bg-stone-200 hover:text-stone-800"
                onClick={(e) => {
                  onRenameProject();
                  (
                    e.currentTarget.closest('details') as HTMLDetailsElement | null
                  )?.removeAttribute('open');
                }}
              >
                Rename
              </button>
            ) : null}
          </div>
        );
      })}
      <MenuRow
        onClick={onNewProject}
        className="text-stone-500 hover:bg-stone-50 hover:text-stone-800"
      >
        <Plus className="mr-2 size-4 shrink-0 opacity-90" aria-hidden strokeWidth={2} />
        New project
      </MenuRow>
    </MenuDisclosure>
  );
}
