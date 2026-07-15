import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Locator, type Page } from '@playwright/test'
import { expectMinimumTarget, expectNoHorizontalOverflow } from './helpers'

type TargetBox = { x: number; y: number; width: number; height: number }

async function answerDebrief(page: Page, confidence = 4) {
  await page.getByRole('radio', { name: 'All Mail' }).check()
  await page.getByRole('radio', { name: `Recovery confidence ${confidence} of 5` }).check()
  await page.getByRole('button', { name: 'Record trial observation' }).click()
}

async function expectSameBox(beforeBox: TargetBox | null, after: Locator) {
  const afterBox = await after.boundingBox()
  expect(beforeBox).not.toBeNull()
  expect(afterBox).not.toBeNull()
  expect(afterBox?.x).toBeCloseTo(beforeBox?.x ?? 0, 1)
  expect(afterBox?.y).toBeCloseTo(beforeBox?.y ?? 0, 1)
  expect(afterBox?.width).toBeCloseTo(beforeBox?.width ?? 0, 1)
  expect(afterBox?.height).toBeCloseTo(beforeBox?.height ?? 0, 1)
}

async function expectNoAxeViolations(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).analyze()
  const violations = results.violations.map(violation => ({
    id: violation.id,
    impact: violation.impact,
    targets: violation.nodes.map(node => node.target),
  }))
  expect(violations, `${label} accessibility violations`).toEqual([])
}

test.describe('Reversible controlled comparison', () => {
  test('completes detached and in-place recovery with fixed originating geometry @smoke', async ({ page }) => {
    const outboundWrites: string[] = []
    const pageErrors: string[] = []
    page.on('request', request => {
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) outboundWrites.push(`${request.method()} ${request.url()}`)
    })
    page.on('pageerror', error => pageErrors.push(error.message))

    await page.goto('/#lab/reversible')
    await page.getByRole('button', { name: 'Run controlled comparison' }).click()
    await page.getByRole('radio', { name: 'Conventional first' }).check()
    await page.getByRole('button', { name: 'Begin two-condition trial' }).click()

    const comparison = page.locator('.reversible-comparison')
    const inspector = page.getByLabel('Reversible inspector')
    await expect(comparison.getByText('TRIAL A / 2')).toBeVisible()
    await expect(comparison.getByText('Conventional', { exact: true })).toHaveCount(0)
    await expect(comparison.getByText('Adaptive', { exact: true })).toHaveCount(0)
    await expect(inspector.getByText('Masked during trial', { exact: true })).toBeVisible()

    const conventionalArchive = page.getByRole('button', { name: /Archive Action available/i })
    const conventionalArchiveBox = await conventionalArchive.boundingBox()
    await expectMinimumTarget(conventionalArchive)
    await conventionalArchive.click()
    const completedOrigin = page.getByRole('button', { name: /Archived Completed action/i })
    await expectSameBox(conventionalArchiveBox, completedOrigin)
    const detachedUndo = page.getByRole('button', { name: 'Undo Archive' })
    await expectMinimumTarget(detachedUndo)
    await detachedUndo.click()
    await answerDebrief(page, 4)

    await page.getByRole('button', { name: 'Continue to Trial B' }).click()
    const adaptiveArchive = page.getByRole('button', { name: /Archive Action available/i })
    const adaptiveArchiveBox = await adaptiveArchive.boundingBox()
    await adaptiveArchive.click()
    const inPlaceUndo = page.getByRole('button', { name: /Undo Archive 8 seconds remaining/i })
    await expectSameBox(adaptiveArchiveBox, inPlaceUndo)
    await expectMinimumTarget(inPlaceUndo)
    await inPlaceUndo.focus()
    await page.keyboard.press('Enter')
    await answerDebrief(page, 5)

    await expect(page.getByRole('heading', { name: 'Raw recovery observations, not a winner.' })).toBeVisible()
    await expect(comparison.getByText('Conventional', { exact: true })).toBeVisible()
    await expect(comparison.getByText('Adaptive', { exact: true })).toBeVisible()
    await expect(page.getByText('Detached toast', { exact: true })).toBeVisible()
    await expect(page.getByText('Originating control', { exact: true })).toBeVisible()
    await expect(page.getByText(/order Conventional → Adaptive/i)).toBeVisible()
    await expect(page.getByText(/cannot establish recovery superiority/i)).toBeVisible()
    expect(outboundWrites).toEqual([])
    expect(pageErrors).toEqual([])
  })

  test('represents expiry as unavailable on switch-sized mobile reflow @smoke', async ({ page }) => {
    await page.clock.install()
    await page.setViewportSize({ width: 320, height: 840 })
    await page.goto('/#lab/reversible')
    await page.getByRole('button', { name: 'switch', exact: true }).click()
    await page.getByRole('button', { name: 'Run controlled comparison' }).click()
    await page.getByRole('radio', { name: 'Adaptive first' }).check()
    await page.getByRole('checkbox', { name: /Keep this session on this device/i }).check()
    await page.getByRole('button', { name: 'Begin two-condition trial' }).click()

    await expectNoHorizontalOverflow(page)
    await page.getByRole('checkbox', { name: /Reduce Motion/i }).check()
    await page.getByRole('button', { name: /Archive Action available/i }).click()
    await expect(page.locator('.reversible-condition-stage.is-adaptive')).toHaveAttribute('data-reduced-motion', 'true')
    await page.clock.fastForward(8000)

    await expect(page.getByText('Archive remains available in All Mail')).toBeVisible()
    await answerDebrief(page, 5)
    await page.getByRole('button', { name: 'Continue to Trial B' }).click()
    await page.getByRole('button', { name: /Archive Action available/i }).click()
    await page.getByRole('button', { name: 'Undo Archive' }).click()
    await answerDebrief(page, 4)

    await expect(page.getByText('Unavailable', { exact: true })).toBeVisible()
    await expect(page.getByText(/order Adaptive → Conventional/i)).toBeVisible()
    const storedBeforeClear = await page.evaluate(() => localStorage.getItem('interface-behavior-lab:session:v2'))
    expect(storedBeforeClear).not.toBeNull()
    await page.getByRole('button', { name: 'Clear stored session data' }).click()
    const storedAfterClear = await page.evaluate(() => localStorage.getItem('interface-behavior-lab:session:v2'))
    expect(storedAfterClear).toBeNull()
    await expect(page.getByText('Stored session data cleared.')).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })

  test('passes axe in the brief, detached recovery, debrief, in-place recovery, expiry, and results states @a11y', async ({ page }) => {
    await page.clock.install()
    await page.goto('/#lab/reversible')
    await page.getByRole('button', { name: 'Run controlled comparison' }).click()
    await expectNoAxeViolations(page, 'Reversible comparison brief')

    await page.getByRole('radio', { name: 'Conventional first' }).check()
    await page.getByRole('button', { name: 'Begin two-condition trial' }).click()
    await page.getByRole('button', { name: /Archive Action available/i }).click()
    await expectNoAxeViolations(page, 'Reversible detached recovery window')
    await page.getByRole('button', { name: 'Undo Archive' }).click()
    await expectNoAxeViolations(page, 'Reversible recovered debrief')
    await answerDebrief(page, 4)

    await page.getByRole('button', { name: 'Continue to Trial B' }).click()
    await page.getByRole('button', { name: /Archive Action available/i }).click()
    await expectNoAxeViolations(page, 'Reversible in-place recovery window')
    await page.clock.fastForward(8000)
    await expectNoAxeViolations(page, 'Reversible expired debrief')
    await answerDebrief(page, 5)
    await expectNoAxeViolations(page, 'Reversible comparison results')
  })
})
