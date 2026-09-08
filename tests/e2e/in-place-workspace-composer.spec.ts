/**
 * E2E: the composer's "Work without a worktree" option for a Git project.
 *
 * Why E2E: the option only exists once a Git project is the resolved composer
 * target, and the payoff — a row inside that project's sidebar section carrying
 * the shared checkout's branch — is produced by the derived in-place catalog
 * feeding the real grouping/sorting pipeline. No unit boundary spans that.
 */

import { test, expect } from './helpers/orca-app'
import { waitForActiveWorktree, waitForSessionReady } from './helpers/store'

const SCREENSHOT_DIR = process.env.ORCA_INPLACE_SHOT_DIR ?? '/tmp/claude/in-place-shots'

// `uiLanguage` follows the OS locale by default, so the spec pins English before asserting any
// copy. Without the pin these strings would render in whatever language the developer runs.
const ADVANCED = 'Advanced'
const BRANCH_NAME = 'Branch name'
const PARENT_WORKTREE = 'Parent worktree'
const IN_PLACE_LABEL = 'Work without a worktree'
const IN_PLACE_TITLE = 'Create workspace without a worktree'
const CREATE_WORKTREE = 'Create worktree'
const CREATE_WORKSPACE = 'Create workspace'
const STATUS_BAR_ERROR = 'The status bar hit an error.'
const CRASH_DIALOG_TITLE = 'Orca hit a recoverable UI error'
const CRASH_DECLINE = "Don't Send"

test.describe('New workspace composer in-place option', () => {
  test('creates a worktree-free workspace in the project checkout', async ({ orcaPage }) => {
    const renderErrors: string[] = []
    orcaPage.on('console', (message) => {
      if (message.type() === 'error') {
        renderErrors.push(message.text())
      }
    })
    orcaPage.on('pageerror', (error) => {
      renderErrors.push(String(error.stack ?? error))
    })

    await waitForSessionReady(orcaPage)
    await waitForActiveWorktree(orcaPage)

    // Pin the UI language before asserting any copy: `uiLanguage` defaults to the OS locale, so
    // these assertions would otherwise pass or fail depending on whose machine runs the suite.
    await orcaPage.evaluate(async () => {
      await window.__store?.getState().updateSettings({ uiLanguage: 'en' })
    })
    await expect(orcaPage.getByText('Projects')).toBeVisible()

    // Attribution probe: this dev build trips the status-bar error boundary at startup, before
    // anything touches the in-place path. Record it here so a later sighting is not misread as
    // a regression from this feature.
    const statusBarBrokenAtBoot =
      (await orcaPage.getByText(STATUS_BAR_ERROR).count()) > 0 ||
      (await orcaPage.getByText(CRASH_DIALOG_TITLE).count()) > 0
    console.error(`[probe] status bar broken at boot: ${statusBarBrokenAtBoot}`)

    // Dismiss the unrelated crash notice so it does not obscure the screenshots.
    const dismissCrashNotice = async (): Promise<void> => {
      const decline = orcaPage.getByRole('button', { name: CRASH_DECLINE })
      if ((await decline.count()) > 0) {
        await decline.first().click()
      }
    }
    await dismissCrashNotice()

    const worktreeCountBefore = await orcaPage.evaluate(() => {
      const state = window.__store?.getState()
      return Object.values(state?.worktreesByRepo ?? {}).reduce(
        (total, rows) => total + rows.length,
        0
      )
    })

    await orcaPage.evaluate(() => {
      window.__store?.getState().openModal('new-workspace-composer', {})
    })

    const composer = orcaPage.getByRole('dialog')
    await expect(composer).toBeVisible()

    // Expand Advanced so the worktree-only fields are on screen for the before shot. The
    // disclosure animates a grid-rows collapse that `isVisible()` cannot tell apart from open,
    // so settle on a fixed wait rather than a visibility condition.
    await composer.getByText(ADVANCED).click()
    await orcaPage.waitForTimeout(600)
    // getByLabel pins the actual input through its htmlFor association; the bare text
    // also matches the collapsed-section copy.
    await expect(composer.getByLabel(BRANCH_NAME)).toHaveCount(1)
    await expect(composer.getByText(PARENT_WORKTREE)).toHaveCount(1)
    await expect(composer).toContainText(CREATE_WORKTREE)
    await orcaPage.screenshot({ path: `${SCREENSHOT_DIR}/before-worktree-mode.png` })

    const inPlaceCheckbox = composer.getByRole('checkbox', { name: IN_PLACE_LABEL })
    await expect(inPlaceCheckbox).toHaveCount(1)
    // Click the label, as a user would: the input itself is sr-only, so a direct check()
    // races the scroll container for the pointer.
    await composer.getByText(IN_PLACE_LABEL).click()
    await expect(inPlaceCheckbox).toBeChecked()

    // The worktree-shaped controls have nothing to configure once no worktree is created.
    await expect(composer.getByLabel(BRANCH_NAME)).toHaveCount(0)
    await expect(composer.getByText(PARENT_WORKTREE)).toHaveCount(0)
    await expect(composer).toContainText(IN_PLACE_TITLE)
    // Let the checkbox's colour transition finish so the shot shows it ticked.
    await orcaPage.waitForTimeout(400)
    await orcaPage.screenshot({ path: `${SCREENSHOT_DIR}/after-in-place-mode.png` })

    const nameField = composer.getByRole('textbox').first()
    await nameField.fill('in-place probe')
    await composer.getByRole('button', { name: new RegExp(CREATE_WORKSPACE) }).click()

    await expect
      .poll(async () =>
        orcaPage.evaluate(() => {
          const state = window.__store?.getState()
          return (state?.folderWorkspaces ?? []).filter((workspace) => workspace.repoId).length
        })
      )
      .toBe(1)

    const created = await orcaPage.evaluate(() => {
      const state = window.__store?.getState()
      const workspace = (state?.folderWorkspaces ?? []).find((candidate) => candidate.repoId)
      if (!workspace) {
        throw new Error('in-place workspace was not persisted')
      }
      const repo = state?.repos.find((candidate) => candidate.id === workspace.repoId)
      const mainWorktree = (state?.worktreesByRepo[workspace.repoId!] ?? []).find(
        (row) => row.isMainWorktree
      )
      return {
        name: workspace.name,
        repoId: workspace.repoId,
        projectGroupId: workspace.projectGroupId,
        folderPath: workspace.folderPath,
        repoPath: repo?.path ?? null,
        mainBranch: mainWorktree?.branch ?? null
      }
    })

    // The workspace runs in the project's own checkout, and the repo owns it outright.
    expect(created.name).toBe('in-place probe')
    expect(created.projectGroupId).toBe('')
    expect(created.folderPath).toBe(created.repoPath)

    // No worktree was added — the git catalog is untouched.
    const worktreeCountAfter = await orcaPage.evaluate(() => {
      const state = window.__store?.getState()
      return Object.values(state?.worktreesByRepo ?? {}).reduce(
        (total, rows) => total + rows.length,
        0
      )
    })
    expect(worktreeCountAfter).toBe(worktreeCountBefore)

    // The sidebar row sits under the project and borrows the shared checkout's branch.
    const sidebarRow = orcaPage.locator(`[data-worktree-id^="folder:"]`).first()
    await expect(sidebarRow).toBeVisible()
    await expect(sidebarRow).toContainText('in-place probe')
    if (created.mainBranch) {
      await expect(sidebarRow).toContainText(created.mainBranch.replace('refs/heads/', ''))
    }
    await dismissCrashNotice()
    await orcaPage.screenshot({ path: `${SCREENSHOT_DIR}/after-sidebar-row.png` })

    if (renderErrors.length > 0) {
      console.error('=== RENDER ERRORS ===')
      for (const entry of renderErrors) {
        console.error(entry)
      }
    }
    // Only a status-bar failure that was NOT already broken at boot could be this feature's doing.
    const statusBarBrokenAtEnd = (await orcaPage.getByText(STATUS_BAR_ERROR).count()) > 0
    console.error(`[probe] status bar broken at end: ${statusBarBrokenAtEnd}`)
    expect(statusBarBrokenAtEnd && !statusBarBrokenAtBoot).toBe(false)
  })
})
