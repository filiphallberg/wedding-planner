import {
  createLocalProject,
  type LocalProjectMeta,
  listLocalProjects,
  migrateLegacyLocalStorageIfNeeded,
} from '../state/localProjectStorage';

/** Runs legacy migration and ensures at least one local project exists. */
export function ensureLocalProjectsReady(): LocalProjectMeta[] {
  migrateLegacyLocalStorageIfNeeded();
  let list = listLocalProjects();
  if (list.length === 0) {
    const project = createLocalProject('Main');
    list = [{ id: project.id, name: project.name, updatedAt: project.updatedAt }];
  }
  return list;
}
