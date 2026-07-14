import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { expectMinimumTarget, expectNoHorizontalOverflow } from './helpers'

async function answerDebrief(page: Page, confidence: number, effort: 'Clearer' | 'Unchanged') {
  await page.getByRole('radio', { name: 'Move four items to Trash' }).check()
  await page.getByRole('radio', { name: `Pressure confidence ${confidence} of 5` }).check()
  await page.getByRole('radio', { name: effort }).check()
  await page.getByRole('button', { name: 'Record trial observation' }).click()
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

test.describe('Pressure controlled comparison', () => {
  test('completes both masked conditions and reveals exploratory action observations @smoke', async ({ page }) => {
    const outboundWrites: string[] = []
    page.on('request', request => {
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) outboundWrites.push(`${request.method()} ${request.url()}`)
    })

    await page.goto('/#lab/pressure')
    await page.getByRole('button', { name: 'Run controlled comparison' }).click()
    await page.getByRole('radio', { name: 'Conventional first' }).check()
    await page.getByRole('button', { name: 'Begin two-condition trial' }).click()

    const comparison = page.locator('.pressure-comparison')
    const inspector = page.getByLabel('Pressure inspector')
    await expect(comparison.getByText('TRIAL A / 2')).toBeVisible()
    await expect(comparison.getByText('Conventional', { exact: true })).toHaveCount(0)
    await expect(comparison.getByText('Adaptive', { exact: true })).toHaveCount(0)
    await expect(inspector.getByText('Masked during trial', { exact: true })).toBeVisible()

    const trashChoice = page.getByRole('button', { name: /Move to Trash Reversible action/i })
    await expectMinimumTarget(trashChoice)
    await trashChoice.focus()
    await page.keyboard.press('Enter')
    await answerDebrief(page, 3, 'Unchanged')

    await page.getByRole('button', { name: 'Continue to Trial B' }).click()
    await page.getByRole('button', { name: /Act$/ }).click()
    const adaptiveControl = page.locator('.pressure-adaptive-condition .adaptive-button')
    await expectMinimumTarget(adaptiveControl)
    await adaptiveControl.focus()
    await page.keyboard.press('Enter')
    await answerDebrief(page, 5, 'Clearer')

    await expect(page.getByRole('heading', { name: 'Raw action choices, not a winner.' })).toBeVisible()
    await expect(comparison.getByText('Conventional', { exact: true })).toBeVisible()
    await expect(comparison.getByText('Adaptive', { exact: true })).toBeVisible()
    await expect(page.getByText(/order Conventional → Adaptive/i)).toBeVisible()
    await expect(page.getByText(/cannot prove that either escalation model is safer or better/i)).toBeVisible()
    expect(outboundWrites).toEqual([])
  })

  test('supports adaptive-first cancellation, reduced motion, local consent, clear data, and mobile reflow @smoke', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 840 })
    await page.goto('/#lab/pressure')
    await page.getByRole('checkbox', { name: /Reduce Motion/i }).check()
    await page.getByRole('button', { name: 'Run controlled comparison' }).click()
    await page.getByRole('radio', { name: 'Adaptive first' }).check()
    await page.getByRole('checkbox', { name: /Keep this session on this device/i }).check()
    await page.getByRole('button', { name: 'Begin two-condition trial' }).click()

    await expectNoHorizontalOverflow(page)
    await page.getByRole('button', { name: /Commit$/ }).click()
    await expect(page.getByText('Permanent deletion cannot be undone.')).toBeVisible()
    await page.getByRole('button', { name: 'Cancel permanent stage' }).click()
    await page.locator('.pressure-adaptive-condition .adaptive-button').click()
    await answerDebrief(page, 4, 'Clearer')

    await page.getByRole('button', { name: 'Continue to Trial B' }).click()
    await page.getByRole('button', { name: /Delete permanently Cannot be undone/i }).click()
    await page.getByRole('button', { name: 'Cancel permanent action' }).click()
    await page.getByRole('button', { name: /Move to Trash Reversible action/i }).click()
    await answerDebrief(page, 4, 'Unchanged')

    await expect(page.getByText(/order Adaptive → Conventional/i)).toBeVisible()
    const storedBeforeClear = await page.evaluate(() => localStorage.getItem('interface-behavior-lab:session:v2'))
    expect(storedBeforeClear).not.toBeNull()
    await page.getByRole('button', { name: 'Clear stored session data' }).click()
    const storedAfterClear = await page.evaluate(() => localStorage.getItem('interface-behavior-lab:session:v2'))
    expect(storedAfterClear).toBeNull()
    await expect(page.getByText('Stored session data cleared.')).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })

  test('passes axe in the brief, permanent consequence, debrief, and result states @a11y', async ({ page }) => {
    await page.goto('/#lab/pressure')
    await page.getByRole('button', { name: 'Run controlled comparison' }).click()
    await expectNoAxeViolations(page, 'Pressure comparison brief')

    await page.getByRole('radio', { name: 'Conventional first' }).check()
    await page.getByRole('button', { name: 'Begin two-condition trial' }).click()
    await page.getByRole('button', { name: /Delete permanently Cannot be undone/i }).click()
    await expectNoAxeViolations(page, 'Pressure conventional permanent consequence')
    await page.getByRole('button', { name: 'Cancel permanent action' }).click()
    await page.getByRole('button', { name: /Move to Trash Reversible action/i }).click()
    await expectNoAxeViolations(page, 'Pressure comparison debrief')
    await answerDebrief(page, 3, 'Unchanged')

    await page.getByRole('button', { name: 'Continue to Trial B' }).click()
    await page.getByRole('button', { name: /Act$/ }).click()
    await page.locator('.pressure-adaptive-condition .adaptive-button').click()
    await answerDebrief(page, 5, 'Clearer')

    await expectNoAxeViolations(page, 'Pressure comparison results')
  })
})
