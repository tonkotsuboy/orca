import {
  LOCAL_EXECUTION_HOST_ID,
  parseExecutionHostId,
  toSshExecutionHostId,
  type ExecutionHostId
} from '../../../shared/execution-host'
import { FLOATING_TERMINAL_WORKTREE_ID } from '../../../shared/constants'
import { getFolderWorkspaceRepoId } from '../../../shared/folder-workspaces'
import { folderWorkspaceKey, parseWorkspaceKey } from '../../../shared/workspace-scope'
import {
  findIndexedFolderWorkspaceOwner,
  findIndexedProjectGroupOwner,
  findIndexedRepoOwner,
  findIndexedRepoOwnerForHost,
  findIndexedWorktreeOwner,
  findIndexedWorktreeOwnerForHost
} from './worktree-runtime-owner-index'
import type { WorktreeRuntimeOwnerState } from './worktree-runtime-owner'

function getResolvedFolderHost(
  state: WorktreeRuntimeOwnerState,
  folderWorkspaceId: string
): ExecutionHostId | null {
  const preferredHostId =
    state.activeWorktreeId === folderWorkspaceKey(folderWorkspaceId)
      ? (state.activeWorkspaceExecutionHostId ?? undefined)
      : undefined
  const folder = findIndexedFolderWorkspaceOwner(
    state.folderWorkspaces,
    folderWorkspaceId,
    preferredHostId
  )
  const group = folder
    ? findIndexedProjectGroupOwner(state.projectGroups, folder.projectGroupId, preferredHostId)
    : null
  // An in-place workspace is owned by a Git project rather than a folder group, so that project
  // is both its host authority and the hydrated ownership the fallback below demands.
  const ownerRepoId = folder ? getFolderWorkspaceRepoId(folder) : null
  const ownerRepo = ownerRepoId ? findIndexedRepoOwner(state.repos, ownerRepoId) : null
  const explicitHost = parseExecutionHostId(
    folder?.executionHostId ?? group?.executionHostId ?? ownerRepo?.executionHostId
  )
  if (explicitHost) {
    return explicitHost.id
  }
  const connectionId =
    folder?.connectionId?.trim() || group?.connectionId?.trim() || ownerRepo?.connectionId?.trim()
  if (connectionId) {
    return toSshExecutionHostId(connectionId)
  }
  const restoredHost = parseExecutionHostId(
    state.restoredRuntimeHostIdByWorkspaceSessionKey?.[folderWorkspaceKey(folderWorkspaceId)]
  )
  if (restoredHost?.kind === 'runtime') {
    return restoredHost.id
  }
  return folder && (group || ownerRepo || preferredHostId)
    ? (preferredHostId ?? LOCAL_EXECUTION_HOST_ID)
    : null
}

/**
 * Resolves a host only when hydrated ownership proves it. Why: a restored SSH
 * worktree can temporarily collide with a local repo row during catalog load.
 */
export function getResolvedExecutionHostIdForWorktree(
  state: WorktreeRuntimeOwnerState,
  worktreeId: string | null | undefined
): ExecutionHostId | null {
  if (!worktreeId) {
    return null
  }
  if (worktreeId === FLOATING_TERMINAL_WORKTREE_ID) {
    return LOCAL_EXECUTION_HOST_ID
  }
  const scope = parseWorkspaceKey(worktreeId)
  if (scope?.type === 'folder') {
    return getResolvedFolderHost(state, scope.folderWorkspaceId)
  }
  const preferredHostId =
    state.activeWorktreeId === worktreeId
      ? (state.activeWorkspaceExecutionHostId ?? undefined)
      : undefined
  const worktree = preferredHostId
    ? findIndexedWorktreeOwnerForHost(state.worktreesByRepo, worktreeId, preferredHostId)
    : findIndexedWorktreeOwner(state.worktreesByRepo, worktreeId)
  const worktreeHost = parseExecutionHostId(worktree?.hostId)
  if (worktreeHost) {
    return worktreeHost.id
  }
  if (!worktree) {
    return null
  }
  const repo = preferredHostId
    ? findIndexedRepoOwnerForHost(state.repos, worktree.repoId, preferredHostId)
    : findIndexedRepoOwner(state.repos, worktree.repoId)
  if (!repo) {
    return null
  }
  const explicitRepoHost = parseExecutionHostId(repo.executionHostId)
  if (explicitRepoHost) {
    return explicitRepoHost.id
  }
  return repo.connectionId?.trim()
    ? toSshExecutionHostId(repo.connectionId)
    : LOCAL_EXECUTION_HOST_ID
}
