import { expect, type Locator, type Page } from '@playwright/test'

export function specimen(page: Page, family: string): Locator {
  return page.locator(`article.family-${family.toLowerCase()}`)
}

export async function disableNonessentialMotion(page: Page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-delay: 0s !important;
        animation-duration: 0s !important;
        transition-delay: 0s !important;
        transition-duration: 0s !important;
        caret-color: transparent !important;
      }
    `,
  })
}

export async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
  }))
  expect(dimensions.documentWidth).toBeLessThanOrEqual(dimensions.viewportWidth + 1)
}

export async function expectMinimumTarget(locator: Locator, minimum = 44) {
  const box = await locator.boundingBox()
  expect(box, 'target should have a measurable bounding box').not.toBeNull()
  expect(box!.width).toBeGreaterThanOrEqual(minimum)
  expect(box!.height).toBeGreaterThanOrEqual(minimum)
}
