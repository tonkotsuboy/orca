import { getAttachmentLabel } from '@/lib/new-workspace'
import {
  getFullComposerCreateDisabled,
  getQuickComposerCreateDisabled
} from '@/lib/new-workspace-create-gates'
import type { ComposerModel } from './composer-model'
import type { ComposerCardActionProps, ComposerCardSourceProps } from './composer-card-contract'

export function buildComposerCardProps(state: ComposerModel) {
  const {
    advancedOpen,
    agentPrompt,
    attachmentPaths,
    baseBranch,
    branchNameOverride,
    parentWorktreeId,
    createGateMode,
    createError,
    createMultiple,
    creating,
    detectedAgentIds,
    eligibleRepos,
    ephemeralVmRecipeError,
    ephemeralVmRecipes,
    ephemeralVmsEnabled,
    filteredLinkItems,
    folderDetectedAgentIds,
    folderSourceRepos,
    folderCreateDisabled,
    folderTargetConnectInProgress,
    folderTargetConnectionId,
    folderTargetIsRemote,
    folderTargetRequiresConnection,
    folderTargetSshStatus,
    forkPushWarning,
    handleAddAttachment,
    handleBaseBranchChange,
    handleBaseBranchMrSelect,
    handleBaseBranchPrSelect,
    handleBranchNameOverrideChange,
    handleClearSmartNameSelection,
    handleFolderSourceRepoChange,
    handleLinkPopoverChange,
    handleNameValueChange,
    handleOpenAgentSettings,
    handleOpenJiraSettings,
    handleProjectChange,
    handleProjectHostSetupChange,
    handleRemoveLinkedWorkItem,
    handleRepoChange,
    handleReuseSelectedBranchChange,
    handleSelectLinkedItem,
    handleSetupAgentStartupPolicyChange,
    handleSmartBranchSelect,
    handleSmartGitHubItemSelect,
    handleSmartGitLabItemSelect,
    handleSmartJiraIssueSelect,
    handleSmartLinearIssueSelect,
    handleSparseSelectPreset,
    isInPlaceTarget,
    isProjectGroupTarget,
    linkDirectLoading,
    linkItemsLoading,
    linkPopoverOpen,
    linkQuery,
    linkedOnlyTemplatePrompt,
    linkedWorkItem,
    name,
    normalizedLinkQuery,
    note,
    onConnectSelectedProjectGroup,
    onConnectSelectedRepo,
    pathStatusProjectError,
    projectError,
    projectHostSetupOptions,
    projectOptions,
    repoId,
    requiresExplicitSetupChoice,
    resolvedSetupDecision,
    reuseEligibleBranch,
    reuseSelectedBranch,
    selectedEphemeralVmRecipeId,
    selectedProjectHostSetupId,
    selectedProjectId,
    selectedRepo,
    selectedRepoExecutionHostId,
    selectedRepoConnectInProgress,
    selectedRepoConnectionId,
    selectedRepoGitHubSourceContext,
    selectedRepoIsGit,
    selectedRepoProjectId,
    selectedRepoRequiresConnection,
    shouldWaitForIssueAutomationCheck,
    sourceIntentBlocksCreate,
    sparseError,
    selectedRepoSshStatus,
    setAdvancedOpen,
    setAgentPrompt,
    setAttachmentPaths,
    setCreateInPlace,
    setCreateMultiple,
    setLinkQuery,
    setNote,
    setParentWorktreeId,
    setSelectedEphemeralVmRecipeId,
    setSetupDecision,
    setSmartNameMode,
    setTuiAgent,
    setupAgentStartupPolicy,
    setupConfig,
    setupDecision,
    shouldApplyLinkedOnlyTemplate,
    shouldWaitForSetupCheck,
    workspaceSeedName,
    smartNameJiraSourceContext,
    smartNameSelection,
    sparsePresets,
    sparseSelectedPresetId,
    startFromResetHint,
    submit,
    tuiAgent
  } = state

  const createGateInput = {
    repoId,
    workspaceSeedName,
    creating,
    shouldWaitForSetupCheck,
    shouldWaitForIssueAutomationCheck,
    sourceIntentBlocksCreate,
    requiresExplicitSetupChoice,
    hasSetupDecision: Boolean(setupDecision),
    selectedRepoRequiresConnection,
    sparseError
  }
  const repoCreateDisabled =
    createGateMode === 'quick'
      ? getQuickComposerCreateDisabled(createGateInput)
      : getFullComposerCreateDisabled(createGateInput)
  // No worktree is created, so every worktree-shaped control is meaningless: branch name, start
  // point, parent nesting, setup script, sparse checkout, ephemeral VM, create-multiple.
  const worktreeFreeTarget = isProjectGroupTarget || isInPlaceTarget
  // An in-place create writes no files and runs no setup, so it waits on neither probe. It still
  // needs a reachable host and a resolved source intent.
  const inPlaceCreateDisabled =
    creating || sourceIntentBlocksCreate || !repoId || selectedRepoRequiresConnection
  const createDisabled = isProjectGroupTarget
    ? folderCreateDisabled
    : isInPlaceTarget
      ? inPlaceCreateDisabled
      : repoCreateDisabled
  const cardProps: ComposerCardSourceProps & ComposerCardActionProps = {
    eligibleRepos: isProjectGroupTarget ? folderSourceRepos : eligibleRepos,
    repoId,
    projectOptions,
    selectedProjectId,
    selectedRepoIsGit: isProjectGroupTarget ? true : selectedRepoIsGit,
    onRepoChange: isProjectGroupTarget ? handleFolderSourceRepoChange : handleRepoChange,
    onProjectChange: handleProjectChange,
    projectHostSetupOptions: isProjectGroupTarget ? [] : projectHostSetupOptions,
    selectedProjectHostSetupId: isProjectGroupTarget ? null : selectedProjectHostSetupId,
    onProjectHostSetupChange: handleProjectHostSetupChange,
    ephemeralVmRecipes: worktreeFreeTarget || !ephemeralVmsEnabled ? [] : ephemeralVmRecipes,
    selectedEphemeralVmRecipeId:
      worktreeFreeTarget || !ephemeralVmsEnabled ? null : selectedEphemeralVmRecipeId,
    onEphemeralVmRecipeChange: setSelectedEphemeralVmRecipeId,
    ephemeralVmRecipeError:
      worktreeFreeTarget || !ephemeralVmsEnabled ? null : ephemeralVmRecipeError,
    repoBackedSearchRepos: isProjectGroupTarget ? folderSourceRepos : undefined,
    repoBackedSourcesDisabled: isProjectGroupTarget ? folderSourceRepos.length === 0 : false,
    allowSmartNameAddProject: !isProjectGroupTarget,
    smartNameRepoSwitchTarget: isProjectGroupTarget ? 'task-source' : 'project',
    name,
    onNameValueChange: handleNameValueChange,
    // Offered only for a Git project: a folder project has no worktree to skip in the first place.
    canCreateInPlace: !isProjectGroupTarget && selectedRepoIsGit,
    createInPlace: isInPlaceTarget,
    onCreateInPlaceChange: setCreateInPlace,
    branchNameOverride: worktreeFreeTarget ? undefined : branchNameOverride,
    onBranchNameOverrideChange: worktreeFreeTarget ? () => {} : handleBranchNameOverrideChange,
    parentWorktreeId: worktreeFreeTarget ? null : parentWorktreeId,
    onParentWorktreeIdChange: worktreeFreeTarget ? () => {} : setParentWorktreeId,
    selectedRepoExecutionHostId: isProjectGroupTarget ? null : selectedRepoExecutionHostId,
    selectedRepoProjectId: isProjectGroupTarget ? null : selectedRepoProjectId,
    onSmartGitHubItemSelect: handleSmartGitHubItemSelect,
    onSmartGitLabItemSelect: handleSmartGitLabItemSelect,
    onSmartBranchSelect: worktreeFreeTarget ? () => {} : handleSmartBranchSelect,
    onSmartNameModeChange: setSmartNameMode,
    onSmartLinearIssueSelect: handleSmartLinearIssueSelect,
    onSmartJiraIssueSelect: handleSmartJiraIssueSelect,
    onOpenJiraSettings: handleOpenJiraSettings,
    smartNameGitHubSourceContext: selectedRepoGitHubSourceContext,
    smartNameJiraSourceContext,
    smartNameSelection,
    onClearSmartNameSelection: handleClearSmartNameSelection,
    canReuseSelectedBranch:
      !worktreeFreeTarget && reuseEligibleBranch !== null && smartNameSelection?.kind === 'branch',
    reuseSelectedBranch,
    onReuseSelectedBranchChange: handleReuseSelectedBranchChange,
    // Why: "create multiple" applies only to worktree (git) targets; folder-workspace keeps create-and-close.
    showCreateMultiple: !worktreeFreeTarget,
    createMultiple,
    onCreateMultipleChange: setCreateMultiple,
    agentPrompt,
    onAgentPromptChange: setAgentPrompt,
    linkedOnlyTemplatePreview: shouldApplyLinkedOnlyTemplate ? linkedOnlyTemplatePrompt : null,
    attachmentPaths,
    getAttachmentLabel,
    onAddAttachment: () => void handleAddAttachment(),
    onRemoveAttachment: (pathValue) =>
      setAttachmentPaths((current) => current.filter((currentPath) => currentPath !== pathValue)),
    linkedWorkItem,
    onRemoveLinkedWorkItem: handleRemoveLinkedWorkItem,
    linkPopoverOpen,
    onLinkPopoverOpenChange: handleLinkPopoverChange,
    linkQuery,
    onLinkQueryChange: setLinkQuery,
    filteredLinkItems,
    linkItemsLoading,
    linkDirectLoading,
    normalizedLinkQuery,
    onSelectLinkedItem: handleSelectLinkedItem,
    tuiAgent,
    onTuiAgentChange: setTuiAgent,
    detectedAgentIds: isProjectGroupTarget ? folderDetectedAgentIds : detectedAgentIds,
    onOpenAgentSettings: handleOpenAgentSettings,
    advancedOpen,
    onToggleAdvanced: () => setAdvancedOpen((current) => !current),
    createDisabled,
    projectError: isProjectGroupTarget ? pathStatusProjectError : projectError,
    creating,
    onCreate: () => void submit(),
    baseBranch: worktreeFreeTarget ? undefined : baseBranch,
    onBaseBranchChange: worktreeFreeTarget ? () => {} : handleBaseBranchChange,
    onBaseBranchPrSelect: worktreeFreeTarget ? () => {} : handleBaseBranchPrSelect,
    onBaseBranchMrSelect: worktreeFreeTarget ? () => {} : handleBaseBranchMrSelect,
    baseBranchLinkedPrNumber:
      linkedWorkItem?.type === 'pr' && baseBranch ? linkedWorkItem.number : null,
    selectedRepoPath: isProjectGroupTarget ? null : (selectedRepo?.path ?? null),
    selectedRepoIsRemote: isProjectGroupTarget
      ? folderTargetIsRemote
      : Boolean(selectedRepo?.connectionId),
    selectedRepoConnectionId: isProjectGroupTarget
      ? folderTargetConnectionId
      : selectedRepoConnectionId,
    selectedRepoSshStatus: isProjectGroupTarget ? folderTargetSshStatus : selectedRepoSshStatus,
    selectedRepoRequiresConnection: isProjectGroupTarget
      ? folderTargetRequiresConnection
      : selectedRepoRequiresConnection,
    selectedRepoConnectInProgress: isProjectGroupTarget
      ? folderTargetConnectInProgress
      : selectedRepoConnectInProgress,
    onConnectSelectedRepo: isProjectGroupTarget
      ? onConnectSelectedProjectGroup
      : onConnectSelectedRepo,
    startFromResetHint: worktreeFreeTarget ? null : startFromResetHint,
    forkPushWarning: worktreeFreeTarget ? null : forkPushWarning,
    note,
    onNoteChange: setNote,
    setupConfig: worktreeFreeTarget ? null : setupConfig,
    requiresExplicitSetupChoice: worktreeFreeTarget ? false : requiresExplicitSetupChoice,
    setupDecision: worktreeFreeTarget ? null : setupDecision,
    onSetupDecisionChange: worktreeFreeTarget ? () => {} : setSetupDecision,
    setupAgentStartupPolicy: worktreeFreeTarget ? 'start-immediately' : setupAgentStartupPolicy,
    onSetupAgentStartupPolicyChange: worktreeFreeTarget
      ? () => {}
      : handleSetupAgentStartupPolicyChange,
    shouldWaitForSetupCheck: worktreeFreeTarget ? false : shouldWaitForSetupCheck,
    resolvedSetupDecision: worktreeFreeTarget ? null : resolvedSetupDecision,
    createError,
    canUseSparseCheckout: worktreeFreeTarget
      ? false
      : selectedRepoIsGit && !selectedRepo?.connectionId,
    sparsePresets: worktreeFreeTarget ? [] : sparsePresets,
    sparseSelectedPresetId: worktreeFreeTarget ? null : sparseSelectedPresetId,
    onSparseSelectPreset: worktreeFreeTarget ? () => {} : handleSparseSelectPreset,
    branchesEnabled: !worktreeFreeTarget,
    setupControlsEnabled: !worktreeFreeTarget,
    sparseControlsEnabled: !worktreeFreeTarget
  }

  return { cardProps, createDisabled }
}
