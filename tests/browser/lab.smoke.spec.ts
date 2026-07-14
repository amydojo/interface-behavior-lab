import { expect, test } from '@playwright/test'
import { expectMinimumTarget, expectNoHorizontalOverflow, familyRailButton, openFamily, specimen } from './helpers'

const families = ['Intent', 'Pressure', 'Breathing', 'Magnetic', 'Ethical', 'Reversible'] as const
const familyIds = ['intent', 'pressure', 'breathing', 'magnetic', 'ethical', 'reversible'] as const

test.describe('V1.2 active laboratory workspace @smoke', () => {
  test('boots without page errors and exposes every family through one active workspace', async ({ page }) => {
    const errors: Error[] = []
    page.on('pageerror', error => errors.push(error))
    await page.goto('/#lab/intent')

    await expect(page.getByRole('heading', { name: 'Adaptive Controls' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Intent', exact: true })).toBeVisible()
    await expect(page.getByLabel('Intent inspector')).toBeVisible()

    for (const family of families) {
      await expect(familyRailButton(page, family)).toBeVisible()
    }

    await expect(page.locator('.active-specimen-stage .demo-card')).toHaveCount(1)
    expect(errors).toEqual([])
  })

  test('preserves the primary interaction path for all six families', async ({ page }) => {
    await page.goto('/#lab/intent')

    const intent = specimen(page, 'Intent')
    const intentButton = intent.locator('.adaptive-button')
    await intentButton.hover()
    await expect(intent.getByText('State: Revealed')).toBeVisible()
    await intentButton.click()
    await expect(intent.getByText('State: Confirmed')).toBeVisible()

    const pressure = await openFamily(page, 'Pressure')
    await pressure.getByRole('button', { name: /Act/i }).click()
    await pressure.getByRole('button', { name: /Move to Trash/i }).click()
    await expect(pressure.getByRole('button', { name: /Moved to Trash/i })).toBeVisible()

    const breathing = await openFamily(page, 'Breathing')
    await breathing.getByRole('button', { name: /Ask anything/i }).click()
    await breathing.getByRole('button', { name: /Listening/i }).click()
    await expect(breathing.getByText('State: Processing')).toBeVisible()

    const magnetic = await openFamily(page, 'Magnetic')
    const send = magnetic.locator('.adaptive-button')
    await send.focus()
    await expect(magnetic.getByText('State: Aligned')).toBeVisible()
    await send.click()
    await expect(magnetic.getByText('State: Released')).toBeVisible()

    const ethical = await openFamily(page, 'Ethical')
    await ethical.getByRole('button', { name: /^Publish/i }).click()
    await expect(ethical.getByText('This will be visible to 384 people.')).toBeVisible()
    await ethical.getByRole('button', { name: 'Confirm without holding' }).click()
    await expect(ethical.getByText('State: Confirmed')).toBeVisible()

    const reversible = await openFamily(page, 'Reversible')
    await reversible.getByRole('button', { name: /^Archive/i }).click()
    await expect(reversible.getByRole('button', { name: /Undo Archive/i })).toBeVisible()
    await reversible.getByRole('button', { name: /Undo Archive/i }).click()
    await expect(reversible.getByText(/State: Ready/i)).toBeVisible()
  })

  test('deep links every family and restores selection with browser navigation', async ({ page }) => {
    for (const id of familyIds) {
      await page.goto(`/#lab/${id}`)
      await expect(page.locator('.active-specimen-stage .demo-card')).toHaveCount(1)
      await expect(page.locator('.family-item[aria-current="page"]')).toHaveAttribute('aria-current', 'page')
    }

    await page.goto('/#lab/intent')
    await openFamily(page, 'Pressure')
    await openFamily(page, 'Ethical')
    await page.goBack()
    await expect(page.getByRole('heading', { name: 'Pressure', exact: true })).toBeVisible()
    await page.goBack()
    await expect(page.getByRole('heading', { name: 'Intent', exact: true })).toBeVisible()
    await page.goForward()
    await expect(page.getByRole('heading', { name: 'Pressure', exact: true })).toBeVisible()
  })

  test('falls back from an invalid family ID without throwing', async ({ page }) => {
    await page.goto('/#lab/not-real')
    await expect(page.getByRole('heading', { name: 'Intent', exact: true })).toBeVisible()
    await expect(page).toHaveURL(/#lab\/intent$/)
  })

  test('opens a secondary catalog and links every card back to the workspace', async ({ page }) => {
    await page.goto('/#lab/intent')
    await page.getByRole('button', { name: 'View all specimens' }).click()
    await expect(page.getByRole('heading', { name: 'All six behaviors, without the wall.' })).toBeVisible()
    await expect(page.getByRole('button', { name: /Open / })).toHaveCount(6)

    await page.getByRole('button', { name: 'Open Reversible' }).click()
    await expect(page.getByRole('heading', { name: 'Reversible', exact: true })).toBeVisible()
    await expect(page).toHaveURL(/#lab\/reversible$/)
  })

  test('keeps modes, reduced motion, specimen reset, and laboratory reset operable', async ({ page }) => {
    await page.goto('/#lab/intent')
    const shell = page.locator('.app-shell')

    for (const mode of ['light', 'dark', 'spatial']) {
      await page.getByRole('button', { name: mode, exact: true }).click()
      await expect(shell).toHaveAttribute('data-mode', mode)
    }

    await page.getByRole('checkbox', { name: /Reduce Motion/i }).check()
    await expect(shell).toHaveAttribute('data-reduced-motion', 'true')

    await specimen(page, 'Intent').locator('.adaptive-button').hover()
    await expect(specimen(page, 'Intent').getByText('State: Revealed')).toBeVisible()
    await page.getByRole('button', { name: 'Reset specimen' }).click()
    await expect(specimen(page, 'Intent').getByText('State: Rest')).toBeVisible()

    await specimen(page, 'Intent').locator('.adaptive-button').hover()
    await page.getByRole('button', { name: 'Reset laboratory' }).click()
    await expect(specimen(page, 'Intent').getByText('State: Rest')).toBeVisible()
    await expect(page.getByText('laboratory reset')).toBeVisible()
  })

  test('supports keyboard family selection and visible focus', async ({ page }) => {
    await page.goto('/#lab/intent')
    const pressure = familyRailButton(page, 'Pressure')
    await pressure.focus()
    await expect(pressure).toBeFocused()
    await expect(pressure).toHaveCSS('outline-style', 'solid')
    await page.keyboard.press('Enter')

    const heading = page.getByRole('heading', { name: 'Pressure', exact: true })
    await expect(heading).toBeVisible()
    await expect(heading).toBeFocused()
  })

  test('keeps the active primary target stable and at least 44 CSS pixels', async ({ page }) => {
    await page.goto('/#lab/intent')
    const intentButton = specimen(page, 'Intent').locator('.adaptive-button')
    await intentButton.scrollIntoViewIfNeeded()
    const before = await intentButton.boundingBox()
    await intentButton.hover()
    const after = await intentButton.boundingBox()
    expect(before).not.toBeNull()
    expect(after).not.toBeNull()
    expect(Math.abs(before!.x - after!.x)).toBeLessThanOrEqual(1)
    expect(Math.abs(before!.y - after!.y)).toBeLessThanOrEqual(1)
    expect(Math.abs(before!.width - after!.width)).toBeLessThanOrEqual(1)
    expect(Math.abs(before!.height - after!.height)).toBeLessThanOrEqual(1)
    await expectMinimumTarget(intentButton)
  })

  test('prevents stale timers from updating an inactive family', async ({ page }) => {
    await page.clock.install()
    await page.goto('/#lab/intent')
    const intent = specimen(page, 'Intent')
    const intentButton = intent.locator('.adaptive-button')
    await intentButton.focus()
    await expect(intent.getByText('State: Revealed')).toBeVisible()
    await intentButton.click()
    await expect(intent.getByText('State: Confirmed')).toBeVisible()

    const pressure = await openFamily(page, 'Pressure')
    await expect(pressure.getByText('Stage: Preview')).toBeVisible()
    await page.clock.fastForward(5000)
    await expect(pressure.getByText('Stage: Preview')).toBeVisible()
    await expect(page.locator('article.family-intent')).toHaveCount(0)
  })

  test('reflows at required viewport widths without page overflow', async ({ page }) => {
    for (const width of [320, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/#lab/ethical')
      await expectNoHorizontalOverflow(page)
      await expect(specimen(page, 'Ethical').getByRole('button', { name: /^Publish/i })).toBeVisible()
    }
  })

  test('survives 200 percent text size without clipping essential controls', async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 900 })
    await page.goto('/#lab/reversible')
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%'
    })
    await expectNoHorizontalOverflow(page)
    await expect(specimen(page, 'Reversible').getByRole('button', { name: /^Archive/i })).toBeVisible()
  })

  test('uses safe external link relationships', async ({ page }) => {
    await page.goto('/#lab/intent')
    for (const name of ['Figma', 'GitHub']) {
      await expect(page.getByRole('link', { name })).toHaveAttribute('rel', /noreferrer/)
    }
  })

  test('applies the low-effects path without changing semantics', async ({ page }) => {
    await page.addInitScript(() => {
      const original = window.matchMedia.bind(window)
      window.matchMedia = query => query.includes('prefers-reduced-transparency')
        ? {
            matches: true,
            media: query,
            onchange: null,
            addListener: () => undefined,
            removeListener: () => undefined,
            addEventListener: () => undefined,
            removeEventListener: () => undefined,
            dispatchEvent: () => false,
          }
        : original(query)
    })
    await page.goto('/#lab/breathing')
    await expect(page.locator('.app-shell')).toHaveAttribute('data-low-effects', 'true')
    await expect(specimen(page, 'Breathing').getByText('State: Ready')).toBeVisible()
    await expect(page.locator('.active-specimen-stage .demo-card')).toHaveCSS('backdrop-filter', 'none')
  })
})
