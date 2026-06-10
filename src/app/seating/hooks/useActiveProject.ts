import { useMemo } from 'react';
import type { ProjectControls } from '../types';
import { formatProjectMenuLabel } from '../utils/projectMenuLabel';

export function useActiveProject(projectControls: ProjectControls) {
  const { projectId, projects } = projectControls;

  const projectMenuLabel = useMemo(() => {
    const activeProject = projects.find((p) => p.id === projectId);
    return formatProjectMenuLabel(activeProject);
  }, [projects, projectId]);

  return { projectMenuLabel };
}
