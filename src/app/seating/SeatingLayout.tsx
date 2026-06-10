import { useEventStateContext } from '../../state/context/EventStateContext';
import { SeatingLoading } from './components/SeatingLoading';
import { ProjectControlsProvider } from './context/ProjectControlsContext';
import { SeatingUIProvider } from './context/SeatingUIContext';
import { SeatingLayoutShell } from './SeatingLayoutShell';
import type { SeatingLayoutProps } from './types';

export function SeatingLayout({ projectControls, userSlot }: SeatingLayoutProps) {
  const { hydrated } = useEventStateContext();
  const { projectId } = projectControls;

  if (!hydrated && projectId) {
    return <SeatingLoading />;
  }

  return (
    <ProjectControlsProvider value={{ ...projectControls, userSlot }}>
      <SeatingUIProvider>
        <SeatingLayoutShell />
      </SeatingUIProvider>
    </ProjectControlsProvider>
  );
}
