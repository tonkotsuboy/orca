import { useMemo } from 'react'
import {
  toProjectGroupComposerOwner,
  toRepoComposerOwner
} from '@/components/sidebar/folder-workspace-composer-owner'
import { parseExecutionHostId, type ExecutionHostId } from '../../../../shared/execution-host'
import type { ProjectGroup } from '../../../../shared/project-group-types'
import type { Repo } from '../../../../shared/repo-types'
import type { FolderWorkspaceSubmitTarget } from './runtime-target-model'

/**
 * Resolves the owner and host for the worktree-free submit path.
 *
 * The in-place owner wins when present: its host comes from the Git project it shares a checkout
 * with, not from the folder-group fields, which describe a different target entirely.
 */
export function useFolderSubmitTarget(args: {
  inPlaceRepo: Repo | null
  inPlaceRepoExecutionHostId: ExecutionHostId | null
  inPlaceRepoIsRemote: boolean
  selectedProjectGroup: ProjectGroup | null
  folderTargetConnectionId: string | null
  folderTargetRuntimeEnvironmentId: string | null
  folderTargetIsRemote: boolean
}): FolderWorkspaceSubmitTarget | null {
  const {
    inPlaceRepo,
    inPlaceRepoExecutionHostId,
    inPlaceRepoIsRemote,
    selectedProjectGroup,
    folderTargetConnectionId,
    folderTargetRuntimeEnvironmentId,
    folderTargetIsRemote
  } = args
  const parsedInPlaceHost = parseExecutionHostId(inPlaceRepoExecutionHostId)
  const inPlaceRuntimeEnvironmentId =
    parsedInPlaceHost?.kind === 'runtime' ? parsedInPlaceHost.environmentId : null

  return useMemo(() => {
    if (inPlaceRepo) {
      return {
        owner: toRepoComposerOwner(inPlaceRepo),
        connectionId: inPlaceRepo.connectionId ?? null,
        runtimeEnvironmentId: inPlaceRuntimeEnvironmentId,
        isRemote: inPlaceRepoIsRemote
      }
    }
    return selectedProjectGroup?.parentPath
      ? {
          owner: toProjectGroupComposerOwner(selectedProjectGroup),
          connectionId: folderTargetConnectionId,
          runtimeEnvironmentId: folderTargetRuntimeEnvironmentId,
          isRemote: folderTargetIsRemote
        }
      : null
  }, [
    folderTargetConnectionId,
    folderTargetIsRemote,
    folderTargetRuntimeEnvironmentId,
    inPlaceRepo,
    inPlaceRepoIsRemote,
    inPlaceRuntimeEnvironmentId,
    selectedProjectGroup
  ])
}
