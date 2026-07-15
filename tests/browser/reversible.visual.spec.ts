import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { inflateSync } from 'node:zlib'
import { expect, test, type Locator, type Page, type TestInfo } from '@playwright/test'
import { disableNonessentialMotion } from './helpers'
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
  if (image.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
    throw new Error('Visual fingerprint expects a PNG screenshot')
  }

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
    } else if (type === 'IDAT') imageData.push(payload)
    else if (type === 'IEND') break
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
      const upLeft = row > 0 && column >= bytesPerPixel ? pixels[rowOffset - stride + column - bytesPerPixel] : 0
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

async function expectVisual(locator: Locator, name: string, testInfo: TestInfo, mask: Locator[] = []) {
  const image = await locator.screenshot({ animations: 'disabled', caret: 'hide', mask })
  const hash = pixelFingerprint(image)
  if (hash !== visualBaseline[name]) {
    const output = testInfo.outputPath(`${name}.actual.png`)
    await mkdir(dirname(output), { recursive: true })
    await writeFile(output, image)
  }
  expect(hash, `${name} visual fingerprint`).toBe(visualBaseline[name])
}

async function answerDebrief(page: Page, confidence: number) {
  await page.getByRole('radio', { name: 'All Mail' }).check()
  await page.getByRole('radio', { name: `Recovery confidence ${confidence} of 5` }).check()
  await page.getByRole('button', { name: 'Record trial observation' }).click()
}

test.describe('Reversible comparison visual contract @visual', () => {
  test('Reversible comparison brief', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1100, height: 1050 })
    await page.goto('/#lab/reversible')
    await page.getByRole('button', { name: 'Run controlled comparison' }).click()
    await disableNonessentialMotion(page)
    await expectVisual(page.locator('.reversible-comparison'), 'reversible-comparison-brief', testInfo)
  })

  test('Reversible comparison completed results', async ({ page }, testInfo) => {
    await page.clock.install()
    await page.setViewportSize({ width: 1100, height: 1200 })
    await page.goto('/#lab/reversible')
    await page.getByRole('button', { name: 'Run controlled comparison' }).click()
    await page.getByRole('radio', { name: 'Conventional first' }).check()
    await page.getByRole('button', { name: 'Begin two-condition trial' }).click()
    await page.getByRole('button', { name: /Archive Action available/i }).click()
    await page.getByRole('button', { name: 'Undo Archive' }).click()
    await answerDebrief(page, 4)
    await page.getByRole('button', { name: 'Continue to Trial B' }).click()
    await page.getByRole('button', { name: /Archive Action available/i }).click()
    await page.getByRole('button', { name: /Undo Archive/i }).click()
    await answerDebrief(page, 5)
    await disableNonessentialMotion(page)

    const resultValues = page.locator('.reversible-result-grid dd')
    await expectVisual(
      page.locator('.reversible-comparison'),
      'reversible-comparison-results',
      testInfo,
      [resultValues.nth(1), resultValues.nth(6), resultValues.nth(8), resultValues.nth(13), page.locator('.comparison-session-meta')],
    )
  })
})
