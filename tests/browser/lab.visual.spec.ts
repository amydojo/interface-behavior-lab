import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { expect, test, type Locator, type TestInfo } from '@playwright/test'
import { disableNonessentialMotion, specimen } from './helpers'
import { visualBaseline } from './visual-baseline'

async function expectVisual(
  locator: Locator,
  name: string,
  testInfo: TestInfo,
  options: { mask?: Locator[] } = {},
) {
  const image = await locator.screenshot({
    animations: 'disabled',
    caret: 'hide',
    mask: options.mask,
  })
  const hash = createHash('sha256').update(image).digest('hex')
  const expected = visualBaseline[name]

  if (hash !== expected) {
    const output = testInfo.outputPath(`${name}.actual.png`)
    await mkdir(dirname(output), { recursive: true })
    await writeFile(output, image)
  }

  expect(hash, `${name} visual fingerprint`).toBe(expected)
}

test.describe('V1.1 visual contract @visual', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await disableNonessentialMotion(page)
  })

  test('hero and laboratory controls', async ({ page }, testInfo) => {
    await expectVisual(page.locator('.hero'), 'hero-spatial', testInfo)
    await expectVisual(page.locator('.lab-controls'), 'laboratory-controls', testInfo)
  })

  test('Intent revealed', async ({ page }, testInfo) => {
    const card = specimen(page, 'Intent')
    await card.locator('.adaptive-button').hover()
    await expectVisual(card, 'intent-revealed', testInfo)
  })

  test('Pressure permanent stage', async ({ page }, testInfo) => {
    const card = specimen(page, 'Pressure')
    await card.getByRole('button', { name: /Commit/i }).click()
    await expectVisual(card, 'pressure-commit', testInfo)
  })

  test('Breathing processing', async ({ page }, testInfo) => {
    const card = specimen(page, 'Breathing')
    await card.getByRole('button', { name: /Ask anything/i }).click()
    await card.getByRole('button', { name: /Listening/i }).click()
    await expectVisual(card, 'breathing-processing', testInfo)
  })

  test('Magnetic aligned', async ({ page }, testInfo) => {
    const card = specimen(page, 'Magnetic')
    await card.locator('.adaptive-button').focus()
    await expectVisual(card, 'magnetic-aligned', testInfo)
  })

  test('Ethical consequence', async ({ page }, testInfo) => {
    const card = specimen(page, 'Ethical')
    await card.getByRole('button', { name: /^Publish/i }).click()
    await expectVisual(card, 'ethical-consequence', testInfo)
  })

  test('Reversible recovery', async ({ page }, testInfo) => {
    const card = specimen(page, 'Reversible')
    await card.getByRole('button', { name: /^Archive/i }).click()
    await expectVisual(card, 'reversible-recovery', testInfo, {
      mask: [card.locator('.adaptive-meta')],
    })
  })

  test('320px mobile laboratory', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 320, height: 800 })
    await page.reload()
    await disableNonessentialMotion(page)
    await expectVisual(page.locator('.laboratory'), 'laboratory-mobile-320', testInfo)
  })
})
