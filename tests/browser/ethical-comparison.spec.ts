import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { expectMinimumTarget, expectNoHorizontalOverflow } from './helpers'

async function answerDebrief(
  page: Page,
  confidence = 4,
  coercion = 2,
  accidental: 'No' | 'Yes' = 'No',
) {
  await page.getByRole('radio', { name: '384 people, location, and tagged people' }).check()
  await page.getByRole('radio', { name: accidental }).check()
  await page.getByRole('radio', { name: `Outcome confidence ${confidence} of 5` }).check()
  await page.getByRole('radio', { name: `Coercion ${coercion} of 5` }).check()
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

test.describe('Ethical controlled comparison', () => {
  test('completes both masked conditions and reveals exploratory commitment observations @smoke', async ({ page }) => {
    const outboundWrites: string[] = []
    page.on('request', request => {
      if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) outboundWrites.push(`${request.method()} ${request.url()}`)
    })

    await page.goto('/#lab/ethical')
    await page.getByRole('button', { name: 'Run controlled comparison' }).click()
    await page.getByRole('radio', { name: 'Conventional first' }).check()
    await page.getByRole('button', { name: 'Begin two-condition trial' }).click()

    const comparison = page.locator('.ethical-comparison')
    const inspector = page.getByLabel('Ethical inspector')
    await expect(comparison.getByText('TRIAL A / 2')).toBeVisible()
    await expect(comparison.getByText('Conventional', { exact: true })).toHaveCount(0)
    await expect(comparison.getByText('Adaptive', { exact: true })).toHaveCount(0)
    await expect(inspector.getByText('Masked during trial', { exact: true })).toBeVisible()

    await page.getByRole('button', { name: 'Publish' }).click()
    const dialog = page.getByRole('dialog', { name: 'Publish this post?' })
    const consequence = dialog.getByText('This will be visible to 384 people.')
    const publish = dialog.getByRole('button', { name: 'Publish' })
    await expect(consequence).toBeVisible()
    await expect(dialog.getByText('Your location and tagged people will also be included.')).toBeVisible()
    const consequencePrecedesCommit = await dialog.evaluate(element => {
      const consequenceNode = element.querySelector('.ethical-consequence-card')
      const publishNode = Array.from(element.querySelectorAll('button')).find(button => button.textContent?.trim() === 'Publish')
      return consequenceNode && publishNode
        ? Boolean(consequenceNode.compareDocumentPosition(publishNode) & Node.DOCUMENT_POSITION_FOLLOWING)
        : false
    })
    expect(consequencePrecedesCommit).toBe(true)
    await expectMinimumTarget(publish)
    await publish.click()
    await answerDebrief(page, 4, 2)

    await page.getByRole('button', { name: 'Continue to Trial B' }).click()
    await expect(comparison.getByText('TRIAL B / 2')).toBeVisible()
    await expect(comparison.getByText('BEFORE YOU COMMIT')).toBeVisible()
    const nonHold = page.getByRole('button', { name: 'Confirm without holding' })
    const cancel = page.getByRole('button', { name: 'Cancel' })
    await expectMinimumTarget(nonHold)
    await expectMinimumTarget(cancel)
    await nonHold.click()
    await answerDebrief(page, 5, 1)

    await expect(page.getByRole('heading', { name: 'Raw commitment observations, not a winner.' })).toBeVisible()
    await expect(comparison.getByText('Conventional', { exact: true })).toBeVisible()
    await expect(comparison.getByText('Adaptive', { exact: true })).toBeVisible()
    await expect(page.getByText('Non-hold confirmation')).toBeVisible()
    await expect(page.getByText(/order Conventional → Adaptive/i)).toBeVisible()
    await expect(page.getByText(/cannot prove that either confirmation pattern is safer/i)).toBeVisible()
    expect(outboundWrites).toEqual([])
  })

  test('supports adaptive-first switch cancellation, persistence, and mobile reflow @smoke', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 840 })
    await page.goto('/#lab/ethical')
    await page.getByRole('button', { name: 'switch', exact: true }).click()
    await page.getByRole('button', { name: 'Run controlled comparison' }).click()
    await page.getByRole('radio', { name: 'Adaptive first' }).check()
    await page.getByRole('checkbox', { name: /Keep this session on this device/i }).check()
    await page.getByRole('button', { name: 'Begin two-condition trial' }).click()

    await expectNoHorizontalOverflow(page)
    await page.getByRole('checkbox', { name: /Reduce Motion/i }).check()
    await expect(page.locator('.ethical-condition-stage.is-adaptive')).toHaveAttribute('data-reduced-motion', 'true')
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByText('Publication cancelled')).toBeVisible()
    await answerDebrief(page, 5, 1)

    await page.getByRole('button', { name: 'Continue to Trial B' }).click()
    await page.getByRole('button', { name: 'Publish' }).click()
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByText('Publication cancelled')).toBeVisible()
    await answerDebrief(page, 5, 1)

    await expect(page.getByText(/order Adaptive → Conventional/i)).toBeVisible()
    await expect(page.getByText('Cancelled', { exact: true })).toHaveCount(2)
    const storedBeforeClear = await page.evaluate(() => localStorage.getItem('interface-behavior-lab:session:v2'))
    expect(storedBeforeClear).not.toBeNull()
    await page.getByRole('button', { name: 'Clear stored session data' }).click()
    const storedAfterClear = await page.evaluate(() => localStorage.getItem('interface-behavior-lab:session:v2'))
    expect(storedAfterClear).toBeNull()
    await expect(page.getByText('Stored session data cleared.')).toBeVisible()
    await expectNoHorizontalOverflow(page)
  })

  test('passes axe in the brief, dialog, adaptive disclosure, debrief, and results states @a11y', async ({ page }) => {
    await page.goto('/#lab/ethical')
    await page.getByRole('button', { name: 'Run controlled comparison' }).click()
    await expectNoAxeViolations(page, 'Ethical comparison brief')

    await page.getByRole('radio', { name: 'Conventional first' }).check()
    await page.getByRole('button', { name: 'Begin two-condition trial' }).click()
    await page.getByRole('button', { name: 'Publish' }).click()
    await expectNoAxeViolations(page, 'Ethical conventional disclosure dialog')

    await page.getByRole('button', { name: 'Publish' }).click()
    await expectNoAxeViolations(page, 'Ethical comparison debrief')
    await answerDebrief(page, 4, 2)
    await page.getByRole('button', { name: 'Continue to Trial B' }).click()
    await expectNoAxeViolations(page, 'Ethical adaptive consequence-first state')

    await page.getByRole('button', { name: 'Confirm without holding' }).click()
    await answerDebrief(page, 5, 1)
    await expectNoAxeViolations(page, 'Ethical comparison results')
  })
})
