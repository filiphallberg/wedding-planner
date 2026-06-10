import { createContext, type PropsWithChildren, type ReactNode, useContext } from 'react';
import type { ProjectControls } from '../types';

export type ProjectControlsContextValue = ProjectControls & {
  userSlot: ReactNode;
};

const ProjectControlsContext = createContext<ProjectControlsContextValue | null>(null);

export function ProjectControlsProvider({
  value,
  children,
}: PropsWithChildren<{ value: ProjectControlsContextValue }>) {
  return (
    <ProjectControlsContext.Provider value={value}>{children}</ProjectControlsContext.Provider>
  );
}

export function useProjectControlsContext(): ProjectControlsContextValue {
  const ctx = useContext(ProjectControlsContext);
  if (!ctx) {
    throw new Error('useProjectControlsContext must be used within ProjectControlsProvider');
  }
  return ctx;
}
