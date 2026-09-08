import type { Worktree } from '../../../shared/worktree/types'
import type { FolderWorkspace } from '../../../shared/folder-workspace-types'
import {
  folderWorkspaceToWorktree,
  getFolderWorkspaceWorktreeHostId
} from '../../../shared/folder-workspace-worktree'
import { getFolderWorkspaceRepoId } from '../../../shared/folder-workspaces'
import type { ExecutionHostId } from '../../../shared/execution-host'
import { getWorktreeMapFromState } from './selectors'
import type { AppState } from './types'

type InPlaceWorkspaceCatalogState = Pick<AppState, 'worktreesByRepo' | 'folderWorkspaces' | 'repos'>

type CatalogCacheEntry = {
  folderWorkspaces: readonly FolderWorkspace[]
  repos: AppState['repos']
  result: AppState['worktreesByRepo']
}

// Why cross-render caching: Zustand reruns selectors on every write, and the sidebar's sort and
// visibility passes both read this. Keyed on the store objects so replaced snapshots are collectable.
const catalogCache = new WeakMap<AppState['worktreesByRepo'], CatalogCacheEntry>()

/**
 * Git state an in-place workspace inherits. It runs inside the project's own checkout — or a
 * directory within it — so the branch and HEAD are whatever that checkout has out right now.
 */
function resolveSharedCheckoutGitIdentity(
  mainWorktrees: readonly Worktree[],
  hostId: ExecutionHostId
): Pick<Worktree, 'branch' | 'head'> | null {
  // Prefer the row on this workspace's own host: one repo id can be registered on several.
  const shared = mainWorktrees.find((worktree) => worktree.hostId === hostId) ?? mainWorktrees[0]
  return shared ? { branch: shared.branch, head: shared.head } : null
}

/**
 * `worktreesByRepo` plus the in-place workspaces each Git project owns.
 *
 * An in-place workspace runs in the project's existing checkout instead of a new worktree, so it
 * belongs in that project's slice rather than in the folder-project lane: grouping, sorting,
 * filtering and Cmd+1-9 numbering then treat it as one of the project's workspaces, and the
 * borrowed branch/HEAD light up the branch, diff and review surfaces gated on `repo && branch`.
 *
 * Deliberately derived rather than merged into the store: `worktreesByRepo` is what the
 * authoritative git scan reconciles and what workspace cleanup offers for `git worktree remove`,
 * and an in-place row belongs in neither.
 *
 * Workspaces whose owning project is gone are dropped — the load-time sweep retires the records.
 */
export function getInPlaceWorkspaceCatalog(
  state: InPlaceWorkspaceCatalogState
): AppState['worktreesByRepo'] {
  const cached = catalogCache.get(state.worktreesByRepo)
  if (
    cached &&
    cached.folderWorkspaces === state.folderWorkspaces &&
    cached.repos === state.repos
  ) {
    return cached.result
  }
  const knownRepoIds = new Set(state.repos.map((repo) => repo.id))
  const rowsByRepoId = new Map<string, Worktree[]>()
  // Scanned once per project, not once per row: several in-place workspaces commonly share a
  // checkout, and this runs inside a Zustand selector.
  const mainWorktreesByRepoId = new Map<string, readonly Worktree[]>()
  const mainWorktreesFor = (repoId: string): readonly Worktree[] => {
    let mainWorktrees = mainWorktreesByRepoId.get(repoId)
    if (!mainWorktrees) {
      mainWorktrees = (state.worktreesByRepo[repoId] ?? []).filter((row) => row.isMainWorktree)
      mainWorktreesByRepoId.set(repoId, mainWorktrees)
    }
    return mainWorktrees
  }
  for (const folderWorkspace of state.folderWorkspaces) {
    const repoId = getFolderWorkspaceRepoId(folderWorkspace)
    if (!repoId || !knownRepoIds.has(repoId)) {
      continue
    }
    const gitIdentity = resolveSharedCheckoutGitIdentity(
      mainWorktreesFor(repoId),
      getFolderWorkspaceWorktreeHostId(folderWorkspace)
    )
    const base = folderWorkspaceToWorktree(folderWorkspace)
    const row = gitIdentity ? { ...base, ...gitIdentity } : base
    const rows = rowsByRepoId.get(repoId)
    if (rows) {
      rows.push(row)
    } else {
      rowsByRepoId.set(repoId, [row])
    }
  }
  let result = state.worktreesByRepo
  if (rowsByRepoId.size > 0) {
    const merged = { ...state.worktreesByRepo }
    for (const [repoId, rows] of rowsByRepoId) {
      merged[repoId] = [...(merged[repoId] ?? []), ...rows]
    }
    result = merged
  }
  catalogCache.set(state.worktreesByRepo, {
    folderWorkspaces: state.folderWorkspaces,
    repos: state.repos,
    result
  })
  return result
}

/**
 * Id-keyed view of the catalog above. The sidebar resolves a dragged or context-menued row
 * through this, so an in-place row has to be addressable by id here too.
 */
export function getInPlaceWorkspaceMap(state: InPlaceWorkspaceCatalogState): Map<string, Worktree> {
  return getWorktreeMapFromState({ worktreesByRepo: getInPlaceWorkspaceCatalog(state) })
}
