import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { expectMinimumTarget, openFamily, specimen } from './helpers'

async function expectNoAxeViolations(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).analyze()
  const summary = results.violations.map(violation => ({
    id: violation.id,
    impact: violation.impact,
    description: violation.description,
    targets: violation.nodes.map(node => node.target),
  }))
  expect(summary, `${label} accessibility violations`).toEqual([])
}

test.describe('V1.2 workspace accessibility contract @a11y', () => {
  test('initial workspace, rail, active stage, and inspector', async ({ page }) => {
    await page.goto('/#lab/intent')
    await expect(page.getByRole('navigation', { name: 'Experiment families', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Intent', exact: true })).toBeVisible()
    await expect(page.getByLabel('Intent inspector')).toBeVisible()
    await expectNoAxeViolations(page, 'initial active workspace')
  })

  test('catalog cards retain direct named paths into the workspace', async ({ page }) => {
    await page.goto('/#catalog')
    await expect(page.getByRole('button', { name: /Open / })).toHaveCount(6)
    await expectNoAxeViolations(page, 'specimen catalog')
  })

  test('Intent revealed state retains a named, stable target', async ({ page }) => {
    await page.goto('/#lab/intent')
    const card = specimen(page, 'Intent')
    const button = card.locator('.adaptive-button')
    await button.scrollIntoViewIfNeeded()
    const before = await button.boundingBox()
    await button.hover()
    const after = await button.boundingBox()
    await expect(card.getByText('State: Revealed')).toBeVisible()
    await expect(page.getByLabel('Intent inspector').getByText('Revealed', { exact: true })).toBeVisible()
    await expectMinimumTarget(button)
    expect(before).not.toBeNull()
    expect(after).not.toBeNull()
    expect(Math.abs(before!.x - after!.x)).toBeLessThanOrEqual(1)
    expect(Math.abs(before!.y - after!.y)).toBeLessThanOrEqual(1)
    await expectNoAxeViolations(page, 'Intent revealed workspace')
  })

  test('Pressure permanent stage remains explicit', async ({ page }) => {
    await page.goto('/#lab/intent')
    const card = await openFamily(page, 'Pressure')
    await card.getByRole('button', { name: /Commit/i }).click()
    await expect(card.getByText('Stage: Commit')).toBeVisible()
    await expect(card.getByText(/Cannot be undone/i)).toBeVisible()
    await expectNoAxeViolations(page, 'Pressure permanent stage')
  })

  test('Breathing processing remains literal with motion disabled', async ({ page }) => {
    await page.goto('/#lab/breathing')
    await page.getByRole('checkbox', { name: /Reduce Motion/i }).check()
    const card = specimen(page, 'Breathing')
    await card.getByRole('button', { name: /Ask anything/i }).click()
    await card.getByRole('button', { name: /Listening/i }).click()
    await expect(card.getByText('State: Processing')).toBeVisible()
    await expect(card.locator('.adaptive-button')).toHaveClass(/motion-reduced/)
    await expectNoAxeViolations(page, 'Breathing processing reduced motion')
  })

  test('Magnetic aligned state stays fixed and keyboard reachable', async ({ page }) => {
    await page.goto('/#lab/magnetic')
    const card = specimen(page, 'Magnetic')
    const button = card.locator('.adaptive-button')
    await button.scrollIntoViewIfNeeded()
    const before = await button.boundingBox()
    await button.focus()
    const after = await button.boundingBox()
    await expect(card.getByText('State: Aligned')).toBeVisible()
    expect(before).not.toBeNull()
    expect(after).not.toBeNull()
    expect(Math.abs(before!.x - after!.x)).toBeLessThanOrEqual(1)
    expect(Math.abs(before!.y - after!.y)).toBeLessThanOrEqual(2)
    expect(after!.width).toBe(before!.width)
    expect(after!.height).toBe(before!.height)
    await expectNoAxeViolations(page, 'Magnetic aligned workspace')
  })

  test('Ethical consequence precedes accessible commitment and cancel', async ({ page }) => {
    await page.goto('/#lab/ethical')
    const card = specimen(page, 'Ethical')
    await card.getByRole('button', { name: /^Publish/i }).click()
    const consequence = card.getByText('This will be visible to 384 people.')
    const confirm = card.getByRole('button', { name: 'Confirm without holding' })
    await expect(consequence).toBeVisible()
    await expect(confirm).toBeVisible()
    await expect(card.getByRole('button', { name: 'Cancel' })).toBeVisible()
    const order = await card.evaluate(element => {
      const consequenceNode = element.querySelector('.consequence-card')
      const confirmNode = Array.from(element.querySelectorAll('button')).find(button => button.textContent?.includes('Confirm without holding'))
      return consequenceNode && confirmNode
        ? Boolean(consequenceNode.compareDocumentPosition(confirmNode) & Node.DOCUMENT_POSITION_FOLLOWING)
        : false
    })
    expect(order).toBe(true)
    await expectNoAxeViolations(page, 'Ethical consequence workspace')
  })

  test('Reversible recovery and expired states remain understandable', async ({ page }) => {
    await page.clock.install()
    await page.goto('/#lab/reversible')
    const card = specimen(page, 'Reversible')
    await card.getByRole('button', { name: /^Archive/i }).click()
    const undo = card.getByRole('button', { name: /Undo Archive/i })
    await expect(undo).toBeVisible()
    await expectMinimumTarget(undo)
    await expectNoAxeViolations(page, 'Reversible recovery window')

    await page.clock.fastForward(8100)
    await expect(card.getByText(/State: Expired. Find the message in All Mail./i)).toBeVisible()
    await expectNoAxeViolations(page, 'Reversible expired workspace')
  })

  test('mobile family selector and expanded inspector remain understandable', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 })
    await page.goto('/#lab/ethical')
    await page.getByText('Success signal', { exact: true }).click()
    await expect(page.getByText(/Audience consequences appear before final commitment/i)).toBeVisible()
    await expectNoAxeViolations(page, 'mobile expanded inspector')
  })
})
