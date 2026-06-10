import { useMemo } from 'react';
import type { ProjectControls } from '../types';
import { formatProjectMenuLabel } from '../utils/projectMenuLabel';

export function useActiveProject(projectControls: ProjectControls) {
  const { projectId, projects } = projectControls;

  const activeProject = useMemo(
    () => projects.find((p) => p.id === projectId),
    [projects, projectId],
  );

  const projectMenuLabel = formatProjectMenuLabel(activeProject);

  return { activeProject, projectMenuLabel };
}
