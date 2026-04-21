import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  acceptInviteApi,
  createProjectApi,
  listProjectsApi,
  type ProjectMeta,
  renameProjectApi,
} from '../sync/projectApi';

type UseCloudProjectsOptions = {
  enabled: boolean;
  /** Set when the route is `/projects/:projectId`; omit on `/`. */
  urlProjectId?: string;
};

export function useCloudProjects({ enabled, urlProjectId }: UseCloudProjectsOptions) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const inviteToken = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('invite');
  }, []);
  const [inviteTokenHandled, setInviteTokenHandled] = useState(() => !inviteToken);

  const projectsQuery = useQuery({
    queryKey: ['projects'],
    queryFn: listProjectsApi,
    enabled,
  });

  const createProjectMutation = useMutation({
    mutationFn: createProjectApi,
    onSuccess: (created) => {
      queryClient.setQueryData<ProjectMeta[]>(['projects'], (prev = []) => [...prev, created]);
      navigate(`/projects/${created.id}`, { replace: true });
    },
  });

  const renameProjectMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => renameProjectApi(id, name),
    onSuccess: (updated) => {
      queryClient.setQueryData<ProjectMeta[]>(['projects'], (prev = []) =>
        prev.map((project) => (project.id === updated.id ? updated : project)),
      );
    },
  });

  const acceptInviteMutation = useMutation({
    mutationFn: acceptInviteApi,
    onSuccess: (joined) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] }).catch(() => undefined);
      navigate(`/projects/${joined.id}`, { replace: true });
    },
  });

  useEffect(() => {
    if (!enabled || inviteTokenHandled || !inviteToken) return;
    const params = new URLSearchParams(window.location.search);

    acceptInviteMutation.mutate(inviteToken, {
      onError: (error) => {
        window.alert(error instanceof Error ? error.message : 'Could not accept invitation');
      },
      onSettled: () => {
        params.delete('invite');
        const qs = params.toString();
        const nextUrl = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`;
        window.history.replaceState({}, '', nextUrl);
        setInviteTokenHandled(true);
      },
    });
  }, [acceptInviteMutation, enabled, inviteToken, inviteTokenHandled]);

  useEffect(() => {
    if (!enabled || !inviteTokenHandled || !projectsQuery.isSuccess) return;
    if (projectsQuery.data.length > 0) return;
    createProjectMutation.mutate('Main');
  }, [
    createProjectMutation,
    enabled,
    inviteTokenHandled,
    projectsQuery.data,
    projectsQuery.isSuccess,
  ]);

  const projects = useMemo(() => projectsQuery.data ?? [], [projectsQuery.data]);

  const defaultProjectId = useMemo(() => {
    if (projects.length === 0) return null;
    return projects[0]!.id;
  }, [projects]);

  const activeId = useMemo(() => {
    if (projects.length === 0) return null;
    if (urlProjectId) {
      return projects.some((p) => p.id === urlProjectId) ? urlProjectId : null;
    }
    return null;
  }, [projects, urlProjectId]);

  const goToProject = useCallback(
    (id: string) => {
      navigate(`/projects/${id}`);
    },
    [navigate],
  );

  const createProjectWithPrompt = useCallback(async () => {
    const name = window.prompt('Project name', 'Untitled');
    if (name === null) return;
    try {
      await createProjectMutation.mutateAsync(name || 'Untitled');
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Could not create project');
    }
  }, [createProjectMutation]);

  const renameActiveProjectWithPrompt = useCallback(async () => {
    if (!activeId) return;
    const current = projects.find((project) => project.id === activeId);
    const name = window.prompt('Project name', current?.name ?? '');
    if (name === null) return;
    try {
      await renameProjectMutation.mutateAsync({
        id: activeId,
        name: name || 'Untitled',
      });
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Could not rename');
    }
  }, [activeId, projects, renameProjectMutation]);

  return {
    projects,
    activeId,
    defaultProjectId,
    goToProject,
    createProjectWithPrompt,
    renameActiveProjectWithPrompt,
    loading:
      !inviteTokenHandled ||
      projectsQuery.isPending ||
      createProjectMutation.isPending ||
      acceptInviteMutation.isPending,
  };
}
