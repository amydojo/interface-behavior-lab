import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { expectMinimumTarget, expectNoHorizontalOverflow } from './helpers'

async function answerDebrief(page: Page, confidence: number, clarity: 'Clearer' | 'Unchanged') {
  await page.getByRole('radio', { name: 'Save the two changes to Journal' }).check()
  await page.getByRole('radio', { name: `Confidence ${confidence} of 5` }).check()
  await page.getByRole('radio', { name: clarity }).check()
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

test.describe('Intent controlled comparison', () => {
  test('completes both masked conditions and reveals exploratory raw observations @smoke', async ({ page }) => {
    const outboundWrites: string[] = []
    page.on('request', request => {
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) outboundWrites.push(`${request.method()} ${request.url()}`)
    })

    await page.goto('/#lab/intent')
    await page.getByRole('button', { name: 'Run controlled comparison' }).click()
    await page.getByRole('radio', { name: 'Conventional first' }).check()
    await page.getByRole('button', { name: 'Begin two-condition trial' }).click()

    await expect(page.getByText('TRIAL A / 2')).toBeVisible()
    await expect(page.getByText('Condition identity is hidden until both trials are complete.')).toBeVisible()
    await expect(page.getByText('Conventional', { exact: true })).toHaveCount(0)
    await expect(page.getByText('Adaptive', { exact: true })).toHaveCount(0)

    const firstControl = page.locator('.comparison-control-stage .adaptive-button')
    await expectMinimumTarget(firstControl)
    await firstControl.focus()
    await page.keyboard.press('Enter')
    await answerDebrief(page, 3, 'Unchanged')

    await page.getByRole('button', { name: 'Continue to Trial B' }).click()
    await expect(page.getByText('TRIAL B / 2')).toBeVisible()
    const secondControl = page.locator('.comparison-control-stage .adaptive-button')
    await secondControl.focus()
    await expect(secondControl).toHaveAccessibleName('Save to Journal. 2 changes')
    await page.keyboard.press('Enter')
    await answerDebrief(page, 5, 'Clearer')

    await expect(page.getByRole('heading', { name: 'Raw observations, not a winner.' })).toBeVisible()
    await expect(page.getByText('Conventional', { exact: true })).toBeVisible()
    await expect(page.getByText('Adaptive', { exact: true })).toBeVisible()
    await expect(page.getByText(/2 trials ·/)).toBeVisible()
    await expect(page.getByText(/order Conventional → Adaptive/i)).toBeVisible()
    await expect(page.getByText(/cannot prove superiority or statistical significance/i)).toBeVisible()
    expect(outboundWrites).toEqual([])
  })

  test('supports adaptive-first order, reduced motion, local consent, clear data, and mobile reflow @smoke', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 820 })
    await page.goto('/#lab/intent')
    await page.getByRole('checkbox', { name: /Reduce Motion/i }).check()
    await page.getByRole('button', { name: 'Run controlled comparison' }).click()
    await page.getByRole('radio', { name: 'Adaptive first' }).check()
    await page.getByRole('checkbox', { name: /Keep this session on this device/i }).check()
    await page.getByRole('button', { name: 'Begin two-condition trial' }).click()

    await expectNoHorizontalOverflow(page)
    const adaptiveControl = page.locator('.comparison-control-stage .adaptive-button')
    await adaptiveControl.focus()
    await page.keyboard.press('Enter')
    await answerDebrief(page, 4, 'Clearer')
    await page.getByRole('button', { name: 'Continue to Trial B' }).click()
    await page.locator('.comparison-control-stage .adaptive-button').click()
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

  test('passes axe in the brief, debrief, and result states @a11y', async ({ page }) => {
    await page.goto('/#lab/intent')
    await page.getByRole('button', { name: 'Run controlled comparison' }).click()
    await expectNoAxeViolations(page, 'Intent comparison brief')

    await page.getByRole('radio', { name: 'Conventional first' }).check()
    await page.getByRole('button', { name: 'Begin two-condition trial' }).click()
    await page.locator('.comparison-control-stage .adaptive-button').click()
    await expectNoAxeViolations(page, 'Intent comparison debrief')
    await answerDebrief(page, 3, 'Unchanged')
    await page.getByRole('button', { name: 'Continue to Trial B' }).click()
    const adaptiveControl = page.locator('.comparison-control-stage .adaptive-button')
    await adaptiveControl.focus()
    await page.keyboard.press('Enter')
    await answerDebrief(page, 5, 'Clearer')

    await expectNoAxeViolations(page, 'Intent comparison results')
  })
})
