import type { ProjectGroup } from '../../shared/project-group-types'
import type { Repo } from '../../shared/repo-types'

/**
 * Where a new worktree-free workspace will live, resolved from whichever owner the caller named.
 *
 * Shared by the local IPC handler and the runtime RPC because they had drifted: the RPC path
 * still demanded a project group and rejected every in-place create.
 */
export type FolderWorkspaceCreateOwner = {
  folderPath: string
  /** Null for an in-place workspace: its owner is a Git project, not a folder scope. */
  projectGroupId: string | null
  connectionId: string | null
}

export function resolveFolderWorkspaceCreateOwner(args: {
  projectGroupId?: string
  repoId?: string
  folderPath?: string | null
  connectionId?: string | null
  projectGroups: readonly ProjectGroup[]
  repos: readonly Repo[]
}): FolderWorkspaceCreateOwner {
  const group = args.projectGroupId
    ? args.projectGroups.find((entry) => entry.id === args.projectGroupId)
    : undefined
  const ownerRepo = args.repoId ? args.repos.find((repo) => repo.id === args.repoId) : undefined
  const folderPath =
    typeof args.folderPath === 'string' && args.folderPath.trim().length > 0
      ? args.folderPath
      : (ownerRepo?.path ?? group?.parentPath)
  if ((!group && !ownerRepo) || !folderPath) {
    throw new Error('folder_workspace_project_group_not_found')
  }
  return {
    folderPath,
    projectGroupId: group?.id ?? null,
    connectionId: args.connectionId ?? ownerRepo?.connectionId ?? group?.connectionId ?? null
  }
}
