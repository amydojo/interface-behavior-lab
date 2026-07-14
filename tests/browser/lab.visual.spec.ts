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

test.describe('V1.2 active workspace visual contract @visual', () => {
  test('desktop spatial mode, Intent', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 1100 })
    await page.goto('/#lab/intent')
    await disableNonessentialMotion(page)
    await expectVisual(page.locator('.workspace-shell'), 'workspace-intent-desktop-spatial', testInfo)
  })

  test('desktop light mode, Ethical consequence', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 1100 })
    await page.goto('/#lab/ethical')
    await page.getByRole('button', { name: 'light', exact: true }).click()
    await specimen(page, 'Ethical').getByRole('button', { name: /^Publish/i }).click()
    await disableNonessentialMotion(page)
    await expectVisual(page.locator('.workspace-shell'), 'workspace-ethical-desktop-light', testInfo)
  })

  test('tablet dark mode, Magnetic aligned', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1024, height: 1000 })
    await page.goto('/#lab/magnetic')
    await page.getByRole('button', { name: 'dark', exact: true }).click()
    await specimen(page, 'Magnetic').locator('.adaptive-button').focus()
    await disableNonessentialMotion(page)
    await expectVisual(page.locator('.workspace-shell'), 'workspace-magnetic-tablet-dark', testInfo)
  })

  test('mobile spatial mode, Reversible expiring', async ({ page }, testInfo) => {
    await page.clock.install()
    await page.setViewportSize({ width: 320, height: 800 })
    await page.goto('/#lab/reversible')
    const card = specimen(page, 'Reversible')
    await card.getByRole('button', { name: /^Archive/i }).click()
    await page.clock.fastForward(6100)
    await disableNonessentialMotion(page)
    await expectVisual(page.locator('.workspace-shell'), 'workspace-reversible-mobile-expiring', testInfo, {
      mask: [card.locator('.adaptive-meta')],
    })
  })

  test('mobile inspector expanded', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 320, height: 800 })
    await page.goto('/#lab/ethical')
    await page.getByText('Success signal', { exact: true }).click()
    await disableNonessentialMotion(page)
    await expectVisual(page.locator('.workspace-inspector'), 'workspace-inspector-mobile-expanded', testInfo)
  })
})
