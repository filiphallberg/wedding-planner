import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { EventStateProvider } from '../state/context/EventStateContext';
import {
  createLocalProject,
  listLocalProjects,
  renameLocalProject,
} from '../state/localProjectStorage';
import { ensureLocalProjectsReady } from './ensureLocalProjectsReady';
import { SeatingLayout } from './SeatingLayout';

function LocalIndexRoute() {
  const navigate = useNavigate();

  useEffect(() => {
    const t = window.setTimeout(() => {
      const list = ensureLocalProjectsReady();
      navigate(`/projects/${list[0]!.id}`, { replace: true });
    }, 0);
    return () => window.clearTimeout(t);
  }, [navigate]);

  return <div className="flex min-h-svh items-center justify-center text-stone-600">Loading…</div>;
}

function LocalProjectRoute() {
  const { projectId = '' } = useParams();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<{ id: string; name: string; updatedAt: string }[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => {
      const list = ensureLocalProjectsReady();
      setProjects(list.map((p) => ({ ...p })));
      setReady(true);
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!ready || !projectId) return;
    if (!projects.some((p) => p.id === projectId)) {
      navigate(`/projects/${projects[0]!.id}`, { replace: true });
    }
  }, [navigate, projectId, projects, ready]);

  const activeId = ready && projects.some((p) => p.id === projectId) ? projectId : null;

  if (!ready || !activeId) {
    return (
      <div className="flex min-h-svh items-center justify-center text-stone-600">Loading…</div>
    );
  }

  const onNewProject = () => {
    const name = window.prompt('Project name', 'Untitled');
    if (name === null) return;
    const p = createLocalProject(name || 'Untitled');
    setProjects(listLocalProjects().map((x) => ({ ...x })));
    navigate(`/projects/${p.id}`);
  };

  const onRename = async () => {
    const cur = projects.find((p) => p.id === activeId);
    const name = window.prompt('Project name', cur?.name ?? '');
    if (name === null) return;
    renameLocalProject(activeId, name || 'Untitled');
    setProjects(listLocalProjects().map((p) => ({ ...p })));
  };

  return (
    <EventStateProvider key={activeId} projectId={activeId} sync="local">
      <SeatingLayout
        projectControls={{
          projectId: activeId,
          projects,
          onSelectProject: (id) => navigate(`/projects/${id}`),
          onNewProject,
          onRenameProject: onRename,
        }}
        userSlot={null}
      />
    </EventStateProvider>
  );
}

export function LocalApp() {
  return (
    <Routes>
      <Route path="/" element={<LocalIndexRoute />} />
      <Route path="/projects/:projectId" element={<LocalProjectRoute />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
