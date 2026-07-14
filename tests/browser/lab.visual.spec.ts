import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { inflateSync } from 'node:zlib'
import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test'
import { disableNonessentialMotion, specimen } from './helpers'
import { visualBaseline } from './visual-baseline'

function paeth(left: number, up: number, upLeft: number) {
  const estimate = left + up - upLeft
  const leftDistance = Math.abs(estimate - left)
  const upDistance = Math.abs(estimate - up)
  const diagonalDistance = Math.abs(estimate - upLeft)
  if (leftDistance <= upDistance && leftDistance <= diagonalDistance) return left
  if (upDistance <= diagonalDistance) return up
  return upLeft
}

function pixelFingerprint(image: Buffer) {
  const signature = image.subarray(0, 8).toString('hex')
  if (signature !== '89504e470d0a1a0a') throw new Error('Visual fingerprint expects a PNG screenshot')

  let offset = 8
  let width = 0
  let height = 0
  let bitDepth = 0
  let colorType = 0
  let interlace = 0
  const imageData: Buffer[] = []

  while (offset < image.length) {
    const length = image.readUInt32BE(offset)
    const type = image.subarray(offset + 4, offset + 8).toString('ascii')
    const payload = image.subarray(offset + 8, offset + 8 + length)
    offset += length + 12

    if (type === 'IHDR') {
      width = payload.readUInt32BE(0)
      height = payload.readUInt32BE(4)
      bitDepth = payload[8]
      colorType = payload[9]
      interlace = payload[12]
    } else if (type === 'IDAT') {
      imageData.push(payload)
    } else if (type === 'IEND') {
      break
    }
  }

  if (bitDepth !== 8 || interlace !== 0) {
    throw new Error(`Unsupported PNG format: bitDepth=${bitDepth}, interlace=${interlace}`)
  }

  const bytesPerPixel = ({ 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 } as Record<number, number>)[colorType]
  if (!bytesPerPixel) throw new Error(`Unsupported PNG color type: ${colorType}`)

  const inflated = inflateSync(Buffer.concat(imageData))
  const stride = width * bytesPerPixel
  const pixels = Buffer.alloc(stride * height)
  let sourceOffset = 0

  for (let row = 0; row < height; row += 1) {
    const filter = inflated[sourceOffset]
    sourceOffset += 1
    const rowOffset = row * stride

    for (let column = 0; column < stride; column += 1) {
      const source = inflated[sourceOffset]
      sourceOffset += 1
      const left = column >= bytesPerPixel ? pixels[rowOffset + column - bytesPerPixel] : 0
      const up = row > 0 ? pixels[rowOffset - stride + column] : 0
      const upLeft = row > 0 && column >= bytesPerPixel
        ? pixels[rowOffset - stride + column - bytesPerPixel]
        : 0

      let value = source
      if (filter === 1) value += left
      else if (filter === 2) value += up
      else if (filter === 3) value += Math.floor((left + up) / 2)
      else if (filter === 4) value += paeth(left, up, upLeft)
      else if (filter !== 0) throw new Error(`Unsupported PNG row filter: ${filter}`)

      pixels[rowOffset + column] = value & 0xff
    }
  }

  return createHash('sha256')
    .update(`${width}x${height}:${bitDepth}:${colorType}:`)
    .update(pixels)
    .digest('hex')
}

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
  const hash = pixelFingerprint(image)
  const expected = visualBaseline[name]

  if (hash !== expected) {
    const output = testInfo.outputPath(`${name}.actual.png`)
    await mkdir(dirname(output), { recursive: true })
    await writeFile(output, image)
  }

  expect(hash, `${name} visual fingerprint`).toBe(expected)
}

async function answerComparisonDebrief(page: Page, confidence: number, clarity: 'Clearer' | 'Unchanged') {
  await page.getByRole('radio', { name: 'Save the two changes to Journal' }).check()
  await page.getByRole('radio', { name: `Confidence ${confidence} of 5` }).check()
  await page.getByRole('radio', { name: clarity }).check()
  await page.getByRole('button', { name: 'Record trial observation' }).click()
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
    await expectVisual(page.locator('.workspace-shell'), 'workspace-ethical-desktop-light', testInfo, {
      mask: [page.locator('.inspector-history time')],
    })
  })

  test('tablet dark mode, Magnetic aligned', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1024, height: 1000 })
    await page.goto('/#lab/magnetic')
    await page.getByRole('button', { name: 'dark', exact: true }).click()
    await specimen(page, 'Magnetic').locator('.adaptive-button').focus()
    await disableNonessentialMotion(page)
    await expectVisual(page.locator('.workspace-shell'), 'workspace-magnetic-tablet-dark', testInfo, {
      mask: [page.locator('.inspector-history time')],
    })
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
      mask: [card.locator('.adaptive-meta'), page.locator('.inspector-history time')],
    })
  })

  test('mobile inspector expanded', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 320, height: 800 })
    await page.goto('/#lab/ethical')
    await page.getByText('Success signal', { exact: true }).click()
    await disableNonessentialMotion(page)
    await expectVisual(page.locator('.workspace-inspector'), 'workspace-inspector-mobile-expanded', testInfo, {
      mask: [page.locator('.inspector-history time')],
    })
  })

  test('Intent comparison brief', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1100, height: 1000 })
    await page.goto('/#lab/intent')
    await page.getByRole('button', { name: 'Run controlled comparison' }).click()
    await disableNonessentialMotion(page)
    await expectVisual(page.locator('.comparison-trial'), 'intent-comparison-brief', testInfo)
  })

  test('Intent comparison completed results', async ({ page }, testInfo) => {
    await page.clock.install()
    await page.setViewportSize({ width: 1100, height: 1000 })
    await page.goto('/#lab/intent')
    await page.getByRole('button', { name: 'Run controlled comparison' }).click()
    await page.getByRole('radio', { name: 'Conventional first' }).check()
    await page.getByRole('button', { name: 'Begin two-condition trial' }).click()
    await page.locator('.comparison-control-stage .adaptive-button').click()
    await answerComparisonDebrief(page, 3, 'Unchanged')
    await page.getByRole('button', { name: 'Continue to Trial B' }).click()
    const adaptiveControl = page.locator('.comparison-control-stage .adaptive-button')
    await adaptiveControl.focus()
    await page.keyboard.press('Enter')
    await answerComparisonDebrief(page, 5, 'Clearer')
    await disableNonessentialMotion(page)
    const resultValues = page.locator('.comparison-result-grid dd')
    await expectVisual(page.locator('.comparison-trial'), 'intent-comparison-results', testInfo, {
      mask: [resultValues.nth(0), resultValues.nth(4)],
    })
  })
})
