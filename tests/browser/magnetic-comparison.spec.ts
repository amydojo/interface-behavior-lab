import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { expectMinimumTarget, expectNoHorizontalOverflow } from './helpers'

async function answerDebrief(
  page: Page,
  confidence: number,
  effort: 'Easier' | 'Unchanged' | 'Harder',
  assistance: 'Helpful' | 'Neutral' | 'Distracting',
) {
  await page.getByRole('radio', { name: `Magnetic confidence ${confidence} of 5` }).check()
  await page.getByRole('radio', { name: effort }).check()
  await page.getByRole('radio', { name: assistance }).check()
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

async function activateAtCenter(page: Page) {
  const target = page.getByRole('button', { name: /Send to Maya Stable native target/i })
  const box = await target.boundingBox()
  expect(box).not.toBeNull()
  await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2)
}

test.describe('Magnetic controlled comparison', () => {
  test('keeps the native target fixed while completing both masked conditions @smoke', async ({ page }) => {
    const outboundWrites: string[] = []
    page.on('request', request => {
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) outboundWrites.push(`${request.method()} ${request.url()}`)
    })

    await page.goto('/#lab/magnetic')
    await page.getByRole('button', { name: 'Run controlled comparison' }).click()
    await page.getByRole('radio', { name: 'Conventional first' }).check()
    await page.getByRole('button', { name: 'Begin two-condition trial' }).click()

    const comparison = page.locator('.magnetic-comparison')
    const inspector = page.getByLabel('Magnetic inspector')
    await expect(comparison.getByText('TRIAL A / 2')).toBeVisible()
    await expect(comparison.getByText('Conventional', { exact: true })).toHaveCount(0)
    await expect(comparison.getByText('Adaptive', { exact: true })).toHaveCount(0)
    await expect(inspector.getByText('Masked during trial', { exact: true })).toBeVisible()
    await expect(comparison.locator('.magnetic-target-stage')).toHaveClass(/is-static/)

    const conventionalTarget = page.getByRole('button', { name: /Send to Maya Stable native target/i })
    await expectMinimumTarget(conventionalTarget)
    await activateAtCenter(page)
    await answerDebrief(page, 3, 'Unchanged', 'Neutral')

    await page.getByRole('button', { name: 'Continue to Trial B' }).click()
    const stage = comparison.locator('.magnetic-target-stage')
    const adaptiveTarget = page.getByRole('button', { name: /Send to Maya Stable native target/i })
    const before = await adaptiveTarget.boundingBox()
    expect(before).not.toBeNull()
    await page.mouse.move(before!.x + before!.width / 2 + 8, before!.y + before!.height / 2)
    await expect(stage).toHaveAttribute('data-field-state', 'aligned')
    const after = await adaptiveTarget.boundingBox()
    expect(after).not.toBeNull()
    expect(Math.abs(after!.x - before!.x)).toBeLessThanOrEqual(1)
    expect(Math.abs(after!.y - before!.y)).toBeLessThanOrEqual(1)
    expect(Math.abs(after!.width - before!.width)).toBeLessThanOrEqual(1)
    expect(Math.abs(after!.height - before!.height)).toBeLessThanOrEqual(1)

    await activateAtCenter(page)
    await answerDebrief(page, 5, 'Easier', 'Helpful')

    await expect(page.getByRole('heading', { name: 'Raw target observations, not a winner.' })).toBeVisible()
    await expect(comparison.getByText('Conventional', { exact: true })).toBeVisible()
    await expect(comparison.getByText('Adaptive', { exact: true })).toBeVisible()
    await expect(page.getByText(/order Conventional → Adaptive/i)).toBeVisible()
    await expect(page.getByText(/cannot prove that proximity assistance improves performance or accessibility/i)).toBeVisible()
    expect(outboundWrites).toEqual([])
  })

  test('supports adaptive-first switch input, reduced motion, persistence, and mobile reflow @smoke', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 820 })
    await page.goto('/#lab/magnetic')
    await page.getByRole('button', { name: 'switch', exact: true }).click()
    await page.getByRole('button', { name: 'Run controlled comparison' }).click()
    await page.getByRole('radio', { name: 'Adaptive first' }).check()
    await page.getByRole('checkbox', { name: /Keep this session on this device/i }).check()
    await page.getByRole('button', { name: 'Begin two-condition trial' }).click()

    await expectNoHorizontalOverflow(page)
    const stage = page.locator('.magnetic-target-stage')
    const target = page.getByRole('button', { name: /Send to Maya Stable native target/i })
    await page.getByRole('checkbox', { name: /Reduce Motion/i }).check()
    await expect(stage).toHaveAttribute('data-reduced-motion', 'true')
    await target.focus()
    await expect(stage).toHaveAttribute('data-field-state', 'aligned')
    await page.keyboard.press('Enter')
    await expect(page.getByText(/keyboard or switch/i)).toBeVisible()
    await expect(page.getByText(/offset unavailable/i)).toBeVisible()
    await answerDebrief(page, 4, 'Easier', 'Helpful')

    await page.getByRole('button', { name: 'Continue to Trial B' }).click()
    const secondTarget = page.getByRole('button', { name: /Send to Maya Stable native target/i })
    await secondTarget.focus()
    await page.keyboard.press('Enter')
    await answerDebrief(page, 3, 'Unchanged', 'Neutral')

    await expect(page.getByText(/order Adaptive → Conventional/i)).toBeVisible()
    const storedBeforeClear = await page.evaluate(() => localStorage.getItem('interface-behavior-lab:session:v2'))
    expect(storedBeforeClear).not.toBeNull()
    await page.getByRole('button', { name: 'Clear stored session data' }).click()
    const storedAfterClear = await page.evaluate(() => localStorage.getItem('interface-behavior-lab:session:v2'))
    expect(storedAfterClear).toBeNull()
    await expect(page.getByText('Stored session data cleared.')).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })

  test('passes axe in the brief, acquisition, debrief, and result states @a11y', async ({ page }) => {
    await page.goto('/#lab/magnetic')
    await page.getByRole('button', { name: 'Run controlled comparison' }).click()
    await expectNoAxeViolations(page, 'Magnetic comparison brief')

    await page.getByRole('radio', { name: 'Conventional first' }).check()
    await page.getByRole('button', { name: 'Begin two-condition trial' }).click()
    await expectNoAxeViolations(page, 'Magnetic conventional acquisition')

    await activateAtCenter(page)
    await expectNoAxeViolations(page, 'Magnetic comparison debrief')
    await answerDebrief(page, 3, 'Unchanged', 'Neutral')
    await page.getByRole('button', { name: 'Continue to Trial B' }).click()
    await activateAtCenter(page)
    await answerDebrief(page, 5, 'Easier', 'Helpful')

    await expectNoAxeViolations(page, 'Magnetic comparison results')
  })
})
