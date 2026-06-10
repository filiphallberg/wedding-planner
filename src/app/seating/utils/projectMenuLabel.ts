import type { ProjectControls } from '../types';

type Project = ProjectControls['projects'][number];

export function formatProjectMenuLabel(activeProject: Project | undefined): string {
  if (!activeProject) return 'Project';
  return `${activeProject.name}${activeProject.role === 'member' ? ' (shared)' : ''}`;
}
