import type { ReactNode } from 'react';

export type ProjectControls = {
  projectId: string | null;
  projects: { id: string; name: string; role?: 'owner' | 'member' }[];
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
  onRenameProject: () => void;
  canRenameProject?: boolean;
  onOpenInvite?: () => void;
};

export type TableEditorState = null | { mode: 'add' } | { mode: 'edit'; tableId: string };

export type SeatingLayoutProps = {
  projectControls: ProjectControls;
  userSlot: ReactNode;
};
