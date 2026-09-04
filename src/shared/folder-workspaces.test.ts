import { describe, expect, it } from 'vitest'
import { normalizeFolderWorkspaces } from './folder-workspaces'
import type { ProjectGroup } from './project-group-types'
import type { Repo } from './repo-types'

const folderGroup = {
  id: 'group-1',
  name: 'Projects',
  parentPath: '/tmp/projects',
  connectionId: null
} as unknown as ProjectGroup

describe('normalizeFolderWorkspaces host attribution', () => {
  it('drops a stored executionHostId instead of round-tripping it', () => {
    const [workspace] = normalizeFolderWorkspaces(
      [
        {
          id: 'ws-1',
          projectGroupId: 'group-1',
          name: 'Nightly',
          folderPath: '/tmp/projects/nightly',
          connectionId: null,
          executionHostId: 'runtime:env-7'
        }
      ],
      [folderGroup]
    )

    // A runtime-scoped stamp names an authority the desktop store does not own, and it
    // carries no generation to fence on — persisting it would recreate the divergence #12 fixed.
    expect(workspace).toBeDefined()
    expect(workspace.executionHostId).toBeUndefined()
    expect(Object.keys(workspace)).not.toContain('executionHostId')
  })

  it('keeps connectionId as the durable host pin', () => {
    const [pinned] = normalizeFolderWorkspaces(
      [
        {
          id: 'ws-2',
          projectGroupId: 'group-1',
          name: 'Pinned',
          folderPath: '/tmp/projects/pinned',
          connectionId: 'ssh-box',
          executionHostId: 'local'
        }
      ],
      [folderGroup]
    )

    expect(pinned.connectionId).toBe('ssh-box')
    expect(pinned.executionHostId).toBeUndefined()
  })

  it('inherits the group connection when the workspace omits one', () => {
    const [inherited] = normalizeFolderWorkspaces(
      [{ id: 'ws-3', projectGroupId: 'group-1', name: 'Inherited' }],
      [{ ...folderGroup, connectionId: 'ssh-group' } as ProjectGroup]
    )

    expect(inherited.connectionId).toBe('ssh-group')
  })
})

describe('normalizeFolderWorkspaces in-place ownership', () => {
  const gitRepo = {
    id: 'repo-1',
    path: '/tmp/checkouts/orca',
    displayName: 'orca',
    connectionId: null
  } as unknown as Repo

  it('keeps a workspace owned by a Git project and defaults its path to the checkout', () => {
    const [workspace] = normalizeFolderWorkspaces(
      [{ id: 'ws-1', repoId: 'repo-1', name: 'Bug hunt' }],
      [folderGroup],
      [gitRepo]
    )

    expect(workspace.repoId).toBe('repo-1')
    expect(workspace.projectGroupId).toBe('')
    expect(workspace.folderPath).toBe('/tmp/checkouts/orca')
  })

  it('inherits the project connection so an SSH checkout keeps its host pin', () => {
    const [workspace] = normalizeFolderWorkspaces(
      [{ id: 'ws-2', repoId: 'repo-1', name: 'Remote' }],
      [folderGroup],
      [{ ...gitRepo, connectionId: 'ssh-box' } as Repo]
    )

    expect(workspace.connectionId).toBe('ssh-box')
  })

  it('drops a workspace whose owning project is gone', () => {
    expect(
      normalizeFolderWorkspaces([{ id: 'ws-3', repoId: 'repo-missing', name: 'Orphan' }], [], [])
    ).toEqual([])
  })

  it('prefers the project owner when a record carries both owners', () => {
    const [workspace] = normalizeFolderWorkspaces(
      [{ id: 'ws-4', projectGroupId: 'group-1', repoId: 'repo-1', name: 'Both' }],
      [folderGroup],
      [gitRepo]
    )

    expect(workspace.repoId).toBe('repo-1')
    expect(workspace.projectGroupId).toBe('')
  })
})
