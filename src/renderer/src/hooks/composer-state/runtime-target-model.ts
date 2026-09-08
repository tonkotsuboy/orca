import type { RefObject } from 'react'
import type { ExecutionHostId, ParsedExecutionHost } from '../../../../shared/execution-host'
import type { Repo } from '../../../../shared/repo-types'
import type { SshConnectionState, SshConnectionStatus } from '../../../../shared/ssh-types'
import type { TuiAgent } from '../../../../shared/tui-agent'
import type { OrcaVmRecipe } from '../../../../shared/orca-yaml-hook-types'
import type { GlobalSettings } from '../../../../shared/global-settings-types'
import type { AgentStartupShell } from '../../../../shared/tui-agent-startup-shell'
import type { FolderWorkspaceComposerOwner } from '@/components/sidebar/folder-workspace-composer-owner'
import type { NewWorkspaceProjectOption } from '@/lib/new-workspace-project-options'
import type { ProjectHostSetupOption } from '@/lib/project-host-setup-options'
import type { WorkspaceCreationTargetResolution } from '@/lib/project-host-workspace-target'

/**
 * The resolved owner and host for the worktree-free submit path — a folder project group, or the
 * Git project an in-place workspace runs inside. Null when neither target is selected.
 *
 * `connectionId` is not `owner.connectionId`: a runtime-hosted folder group keeps its SSH pin as
 * provenance on the record while executing on the runtime, so the launch host is nulled here only.
 */
export type FolderWorkspaceSubmitTarget = {
  owner: FolderWorkspaceComposerOwner
  connectionId: string | null
  runtimeEnvironmentId: string | null
  isRemote: boolean
}

export type ComposerRuntimeTargetModel = {
  isInPlaceTarget: boolean
  folderSubmitTarget: FolderWorkspaceSubmitTarget | null
  isProjectGroupTarget: boolean
  folderSourceRepos: Repo[]
  parsedFolderTargetHost: ParsedExecutionHost | null
  folderTargetRuntimeEnvironmentId: string | null
  folderTargetConnectionId: string | null
  folderTargetIsRemote: boolean
  folderTargetAgentDetectionTarget:
    | { kind: 'runtime'; environmentId: string; connectionId?: undefined }
    | { kind: 'ssh'; connectionId: string; environmentId?: undefined }
    | { kind: 'local'; environmentId?: undefined; connectionId?: undefined }
    | undefined
  folderTargetSshState: SshConnectionState | null
  folderTargetSshStatus: SshConnectionStatus | null
  folderTargetRequiresConnection: boolean
  folderTargetConnectInProgress: boolean
  folderPathStatusBlocksCreate: boolean
  pathStatusProjectError: string | null
  folderDetectedIds: TuiAgent[] | null
  folderDetectedAgentIds: Set<TuiAgent> | null
  selectedWorkspaceTarget: WorkspaceCreationTargetResolution
  selectedRepo: Repo | undefined
  selectedRepoIsGit: boolean
  selectedRepoExecutionHostId: ExecutionHostId | null
  selectedRepoHookContextKey: string | null
  selectedRepoAgentLaunchPlatform: NodeJS.Platform
  selectedRepoIsRemote: boolean
  selectedRepoStartupShell: AgentStartupShell | undefined
  selectedRepoProjectId: string | null
  selectedProjectId: string | null
  selectedProjectHostSetupId: string | null
  projectHostSetupOptions: ProjectHostSetupOption[]
  projectOptions: NewWorkspaceProjectOption[]
  selectedRepoSettings: Pick<GlobalSettings, 'activeRuntimeEnvironmentId'> | null
  selectedRecipeRepoId: string | null
  selectedRecipeRepoConnectionId: string | null
  ephemeralVmsEnabled: boolean
  ephemeralVmRecipes: OrcaVmRecipe[]
  selectedEphemeralVmRecipeId: string | null
  setSelectedEphemeralVmRecipeId: (recipeId: string | null) => void
  ephemeralVmRecipeError: string | null
  selectedRepoConnectionId: string | null
  selectedRepoSshState: SshConnectionState | null
  selectedRepoSshStatus: SshConnectionStatus | null
  selectedRepoRequiresConnection: boolean
  selectedRepoConnectInProgress: boolean
  repoIdRef: RefObject<string>
}
