import { SignIn, UserButton, useAuth } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { InviteCollaboratorsDialog } from '../components/InviteCollaboratorsDialog';
import { appUrl } from '../lib/appUrl';
import { EventStateProvider } from '../state/context/EventStateContext';
import { SeatingLayout } from './SeatingLayout';
import { useCloudProjects } from './useCloudProjects';

function CloudIndexRoute() {
  const { isLoaded, isSignedIn } = useAuth();
  const navigate = useNavigate();
  const { loading, defaultProjectId, projects } = useCloudProjects({
    enabled: isLoaded && Boolean(isSignedIn),
  });

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    if (loading) return;
    if (!defaultProjectId) return;
    navigate(`/projects/${defaultProjectId}`, { replace: true });
  }, [defaultProjectId, isLoaded, isSignedIn, loading, navigate]);

  if (!isLoaded || (isSignedIn && loading)) {
    return (
      <div className="flex min-h-svh items-center justify-center text-stone-600">Loading…</div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-stone-50 p-4">
        <SignIn routing="hash" />
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex min-h-svh items-center justify-center text-stone-600">Loading…</div>
    );
  }

  return <div className="flex min-h-svh items-center justify-center text-stone-600">Loading…</div>;
}

function CloudProjectRoute() {
  const { projectId = '' } = useParams();
  const { isLoaded, isSignedIn } = useAuth();
  const navigate = useNavigate();
  const [inviteOpen, setInviteOpen] = useState(false);
  const {
    projects,
    activeId,
    defaultProjectId,
    goToProject,
    createProjectWithPrompt,
    renameActiveProjectWithPrompt,
    loading,
  } = useCloudProjects({
    enabled: isLoaded && Boolean(isSignedIn),
    urlProjectId: projectId,
  });

  useEffect(() => {
    if (!isLoaded || !isSignedIn || loading) return;
    if (projects.length === 0) return;
    if (activeId === null && defaultProjectId) {
      navigate(`/projects/${defaultProjectId}`, { replace: true });
    }
  }, [activeId, defaultProjectId, isLoaded, isSignedIn, loading, navigate, projects.length]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-svh items-center justify-center text-stone-600">Loading…</div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/" replace />;
  }

  if (loading || activeId === null) {
    return (
      <div className="flex min-h-svh items-center justify-center text-stone-600">Loading…</div>
    );
  }

  const activeRole = projects.find((project) => project.id === activeId)?.role;
  const canRenameProject = activeRole !== 'member';
  const projectControls = {
    projectId: activeId,
    projects,
    onSelectProject: goToProject,
    onNewProject: () => {
      void createProjectWithPrompt();
    },
    onRenameProject: () => {
      void renameActiveProjectWithPrompt();
    },
    canRenameProject,
    onOpenInvite: activeRole === 'member' ? undefined : () => setInviteOpen(true),
  };

  const afterSignOutUrl = new URL(appUrl('/'), window.location.origin).href;

  return (
    <>
      <EventStateProvider key={activeId} projectId={activeId} sync="cloud">
        <SeatingLayout
          projectControls={projectControls}
          userSlot={<UserButton afterSignOutUrl={afterSignOutUrl} />}
        />
      </EventStateProvider>
      <InviteCollaboratorsDialog
        projectId={activeId}
        open={inviteOpen && Boolean(activeId)}
        onClose={() => setInviteOpen(false)}
      />
    </>
  );
}

export function CloudApp() {
  return (
    <Routes>
      <Route path="/" element={<CloudIndexRoute />} />
      <Route path="/projects/:projectId" element={<CloudProjectRoute />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
