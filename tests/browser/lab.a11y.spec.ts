import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { expectMinimumTarget, specimen } from './helpers'

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

test.describe('V1.1 accessibility contract @a11y', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('initial application state', async ({ page }) => {
    await expectNoAxeViolations(page, 'initial application')
  })

  test('Intent revealed state retains a named, stable target', async ({ page }) => {
    const card = specimen(page, 'Intent')
    const button = card.locator('.adaptive-button')
    await button.scrollIntoViewIfNeeded()
    const before = await button.boundingBox()
    await button.hover()
    const after = await button.boundingBox()
    await expect(card.getByText('State: Revealed')).toBeVisible()
    await expectMinimumTarget(button)
    expect(before).not.toBeNull()
    expect(after).not.toBeNull()
    expect(Math.abs(before!.x - after!.x)).toBeLessThanOrEqual(1)
    expect(Math.abs(before!.y - after!.y)).toBeLessThanOrEqual(1)
    await expectNoAxeViolations(page, 'Intent revealed')
  })

  test('Pressure permanent stage remains explicit', async ({ page }) => {
    const card = specimen(page, 'Pressure')
    await card.getByRole('button', { name: /Commit/i }).click()
    await expect(card.getByText('Stage: Commit')).toBeVisible()
    await expect(card.getByText(/Cannot be undone/i)).toBeVisible()
    await expectNoAxeViolations(page, 'Pressure permanent stage')
  })

  test('Breathing processing state remains literal with motion disabled', async ({ page }) => {
    await page.getByRole('checkbox', { name: /Reduce Motion/i }).check()
    const card = specimen(page, 'Breathing')
    await card.getByRole('button', { name: /Ask anything/i }).click()
    await card.getByRole('button', { name: /Listening/i }).click()
    await expect(card.getByText('State: Processing')).toBeVisible()
    await expect(card.locator('.adaptive-button')).toHaveClass(/motion-reduced/)
    await expectNoAxeViolations(page, 'Breathing processing reduced motion')
  })

  test('Magnetic aligned state stays fixed and keyboard reachable', async ({ page }) => {
    const card = specimen(page, 'Magnetic')
    const button = card.locator('.adaptive-button')
    const before = await button.boundingBox()
    await button.focus()
    const after = await button.boundingBox()
    await expect(card.getByText('State: Aligned')).toBeVisible()
    expect(before).not.toBeNull()
    expect(after).not.toBeNull()
    expect(after).toEqual(before)
    await expectNoAxeViolations(page, 'Magnetic aligned')
  })

  test('Ethical consequence precedes an accessible final commitment', async ({ page }) => {
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
    await expectNoAxeViolations(page, 'Ethical consequence')
  })

  test('Reversible recovery and expired states remain understandable', async ({ page }) => {
    await page.clock.install()
    const card = specimen(page, 'Reversible')
    await card.getByRole('button', { name: /^Archive/i }).click()
    const undo = card.getByRole('button', { name: /Undo Archive/i })
    await expect(undo).toBeVisible()
    await expectMinimumTarget(undo)
    await expectNoAxeViolations(page, 'Reversible recovery window')

    await page.clock.fastForward(8100)
    await expect(card.getByText(/State: Expired. Find the message in All Mail./i)).toBeVisible()
    await expectNoAxeViolations(page, 'Reversible expired')
  })
})
