import { expect, type Locator, type Page } from '@playwright/test'

export function specimen(page: Page, family: string): Locator {
  return page.locator(`.active-specimen-stage article.family-${family.toLowerCase()}`)
}

export async function openFamily(page: Page, family: string): Promise<Locator> {
  const rail = page.getByRole('navigation', { name: 'Experiment families' })
  await rail.getByRole('button', { name: new RegExp(family, 'i') }).click()
  const active = specimen(page, family)
  await expect(active).toBeVisible()
  return active
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
