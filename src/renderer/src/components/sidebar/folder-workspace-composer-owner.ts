import type { ProjectGroup } from '../../../../shared/project-group-types'
import type { Repo } from '../../../../shared/repo-types'

/**
 * What a worktree-free workspace belongs to: a folder project group, or — for an in-place
 * workspace — the Git project whose existing checkout it runs in. Everything downstream needs
 * only the name, the directory and the host, so both owners collapse to this shape.
 */
export type FolderWorkspaceComposerOwner = {
  name: string
  path: string
  connectionId: string | null
} & ({ projectGroupId: string; repoId?: never } | { repoId: string; projectGroupId?: never })

export function toProjectGroupComposerOwner(
  projectGroup: Pick<ProjectGroup, 'id' | 'name' | 'parentPath' | 'connectionId'>
): FolderWorkspaceComposerOwner {
  return {
    projectGroupId: projectGroup.id,
    name: projectGroup.name,
    path: projectGroup.parentPath ?? '',
    connectionId: projectGroup.connectionId ?? null
  }
}

export function toRepoComposerOwner(
  repo: Pick<Repo, 'id' | 'displayName' | 'path' | 'connectionId'>
): FolderWorkspaceComposerOwner {
  return {
    repoId: repo.id,
    name: repo.displayName,
    path: repo.path,
    connectionId: repo.connectionId ?? null
  }
}
