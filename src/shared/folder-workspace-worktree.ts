import type { FolderWorkspace } from './folder-workspace-types'
import type { Worktree } from './worktree/types'
import { folderWorkspaceKey } from './workspace-scope'
import {
  parseExecutionHostId,
  toSshExecutionHostId,
  type ExecutionHostId
} from './execution-host'
import { normalizeWorkspaceCreatorProvenance } from './workspace-creator-provenance'
import { getFolderWorkspaceRepoId } from './folder-workspaces'

/**
 * Git state a repo-backed workspace borrows from the checkout it shares. A worktree-free
 * workspace runs in the project's own checkout, so its branch and HEAD are that checkout's —
 * supplying them is what lights up the branch, diff and review surfaces gated on `repo && branch`.
 */
export type FolderWorkspaceGitIdentity = {
  branch: string
  head: string
}

/** The host the workspace's row claims: its fetch stamp, else its SSH pin, else this machine. */
export function getFolderWorkspaceWorktreeHostId(
  folderWorkspace: Pick<FolderWorkspace, 'executionHostId' | 'connectionId'>
): ExecutionHostId {
  return (
    folderWorkspace.executionHostId ??
    (folderWorkspace.connectionId ? toSshExecutionHostId(folderWorkspace.connectionId) : 'local')
  )
}

export function folderWorkspaceToWorktree(
  folderWorkspace: FolderWorkspace,
  gitIdentity?: FolderWorkspaceGitIdentity | null
): Worktree {
  const linkedTask = folderWorkspace.linkedTask
  const creatorProvenance = normalizeWorkspaceCreatorProvenance(folderWorkspace.creatorProvenance)
  const hostId = getFolderWorkspaceWorktreeHostId(folderWorkspace)
  const parsedHost = parseExecutionHostId(hostId)
  return {
    id: folderWorkspaceKey(folderWorkspace.id),
    repoId:
      getFolderWorkspaceRepoId(folderWorkspace) ??
      `folder-workspace:${folderWorkspace.projectGroupId}`,
    ...(creatorProvenance ? { creatorProvenance } : {}),
    displayName: folderWorkspace.name,
    comment: folderWorkspace.comment,
    linkedIssue:
      linkedTask?.provider === 'github' && linkedTask.type === 'issue' ? linkedTask.number : null,
    linkedPR: null,
    linkedLinearIssue:
      linkedTask?.provider === 'linear' ? (linkedTask.linearIdentifier ?? null) : null,
    linkedGitLabMR: null,
    linkedGitLabIssue:
      linkedTask?.provider === 'gitlab' && linkedTask.type === 'issue' ? linkedTask.number : null,
    linkedBitbucketPR: null,
    linkedAzureDevOpsPR: null,
    linkedGiteaPR: null,
    linkedWorkItem: linkedTask,
    linkedTaskSourceContext: folderWorkspace.linkedTaskSourceContext ?? null,
    isArchived: folderWorkspace.isArchived,
    isUnread: folderWorkspace.isUnread,
    isPinned: folderWorkspace.isPinned,
    sortOrder: folderWorkspace.sortOrder,
    manualOrder: folderWorkspace.manualOrder,
    lastActivityAt: folderWorkspace.lastActivityAt,
    createdAt: folderWorkspace.createdAt,
    createdWithAgent: folderWorkspace.createdWithAgent,
    pendingFirstAgentMessageRename: folderWorkspace.pendingFirstAgentMessageRename,
    firstAgentMessageRenameError: folderWorkspace.firstAgentMessageRenameError,
    workspaceStatus: folderWorkspace.workspaceStatus,
    diffComments: folderWorkspace.diffComments,
    path: folderWorkspace.folderPath,
    head: gitIdentity?.head ?? '',
    branch: gitIdentity?.branch ?? '',
    isBare: false,
    isSparse: false,
    isMainWorktree: false,
    hostId,
    ...(parsedHost?.kind === 'runtime'
      ? { runtimeOwnerEnvironmentId: parsedHost.environmentId }
      : {})
  }
}
