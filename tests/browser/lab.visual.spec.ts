import { expect, test } from '@playwright/test'
import { disableNonessentialMotion, specimen } from './helpers'

test.describe('V1.1 visual contract @visual', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await disableNonessentialMotion(page)
  })

  test('hero and laboratory controls', async ({ page }) => {
    await expect(page.locator('.hero')).toHaveScreenshot('hero-spatial.png')
    await expect(page.locator('.lab-controls')).toHaveScreenshot('laboratory-controls.png')
  })

  test('Intent revealed', async ({ page }) => {
    const card = specimen(page, 'Intent')
    await card.locator('.adaptive-button').hover()
    await expect(card).toHaveScreenshot('intent-revealed.png')
  })

  test('Pressure permanent stage', async ({ page }) => {
    const card = specimen(page, 'Pressure')
    await card.getByRole('button', { name: /Commit/i }).click()
    await expect(card).toHaveScreenshot('pressure-commit.png')
  })

  test('Breathing processing', async ({ page }) => {
    const card = specimen(page, 'Breathing')
    await card.getByRole('button', { name: /Ask anything/i }).click()
    await card.getByRole('button', { name: /Listening/i }).click()
    await expect(card).toHaveScreenshot('breathing-processing.png')
  })

  test('Magnetic aligned', async ({ page }) => {
    const card = specimen(page, 'Magnetic')
    await card.locator('.adaptive-button').focus()
    await expect(card).toHaveScreenshot('magnetic-aligned.png')
  })

  test('Ethical consequence', async ({ page }) => {
    const card = specimen(page, 'Ethical')
    await card.getByRole('button', { name: /^Publish/i }).click()
    await expect(card).toHaveScreenshot('ethical-consequence.png')
  })

  test('Reversible recovery', async ({ page }) => {
    const card = specimen(page, 'Reversible')
    await card.getByRole('button', { name: /^Archive/i }).click()
    await expect(card).toHaveScreenshot('reversible-recovery.png', {
      mask: [card.locator('.adaptive-meta')],
    })
  })

  test('320px mobile laboratory', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 })
    await page.reload()
    await disableNonessentialMotion(page)
    await expect(page.locator('.laboratory')).toHaveScreenshot('laboratory-mobile-320.png')
  })
})
