import { expect, test } from '@playwright/test'
import { expectMinimumTarget, expectNoHorizontalOverflow, specimen } from './helpers'

test.describe('V1.1 laboratory smoke @smoke', () => {
  test('boots without page errors and exposes every specimen', async ({ page }) => {
    const errors: Error[] = []
    page.on('pageerror', error => errors.push(error))
    await page.goto('/')

    await expect(page.getByRole('heading', { name: 'Adaptive Controls' })).toBeVisible()
    for (const family of ['Intent', 'Pressure', 'Breathing', 'Magnetic', 'Ethical', 'Reversible']) {
      await expect(page.getByRole('heading', { name: family, exact: true })).toBeVisible()
    }
    expect(errors).toEqual([])
  })

  test('preserves the primary interaction path for all six families', async ({ page }) => {
    await page.goto('/')

    const intent = specimen(page, 'Intent')
    await intent.getByRole('button', { name: /Done/i }).click()
    await expect(intent.getByText('State: Revealed')).toBeVisible()
    await intent.getByRole('button', { name: /Save to Journal/i }).click()
    await expect(intent.getByText('State: Confirmed')).toBeVisible()

    const pressure = specimen(page, 'Pressure')
    await pressure.getByRole('button', { name: /Act/i }).click()
    await pressure.getByRole('button', { name: /Move to Trash/i }).click()
    await expect(pressure.getByRole('button', { name: /Moved to Trash/i })).toBeVisible()

    const breathing = specimen(page, 'Breathing')
    await breathing.getByRole('button', { name: /Ask anything/i }).click()
    await breathing.getByRole('button', { name: /Listening/i }).click()
    await expect(breathing.getByText('State: Processing')).toBeVisible()

    const magnetic = specimen(page, 'Magnetic')
    const send = magnetic.getByRole('button', { name: /Send/i })
    await send.focus()
    await expect(magnetic.getByText('State: Aligned')).toBeVisible()
    await send.click()
    await expect(magnetic.getByText('State: Released')).toBeVisible()

    const ethical = specimen(page, 'Ethical')
    await ethical.getByRole('button', { name: /^Publish/i }).click()
    await expect(ethical.getByText('This will be visible to 384 people.')).toBeVisible()
    await ethical.getByRole('button', { name: 'Confirm without holding' }).click()
    await expect(ethical.getByText('State: Confirmed')).toBeVisible()

    const reversible = specimen(page, 'Reversible')
    await reversible.getByRole('button', { name: /^Archive/i }).click()
    await expect(reversible.getByRole('button', { name: /Undo Archive/i })).toBeVisible()
    await reversible.getByRole('button', { name: /Undo Archive/i }).click()
    await expect(reversible.getByText(/State: Ready/i)).toBeVisible()
  })

  test('keeps modes, reduced motion, and laboratory reset operable', async ({ page }) => {
    await page.goto('/')
    const shell = page.locator('.app-shell')

    for (const mode of ['light', 'dark', 'spatial']) {
      await page.getByRole('button', { name: mode, exact: true }).click()
      await expect(shell).toHaveAttribute('data-mode', mode)
    }

    await page.getByRole('checkbox', { name: /Reduce Motion/i }).check()
    await expect(shell).toHaveAttribute('data-reduced-motion', 'true')

    const intent = specimen(page, 'Intent')
    await intent.getByRole('button', { name: /Done/i }).click()
    await expect(intent.getByText('State: Revealed')).toBeVisible()
    await page.getByRole('button', { name: 'Reset laboratory' }).click()
    await expect(specimen(page, 'Intent').getByText('State: Rest')).toBeVisible()
    await expect(page.getByText('laboratory reset')).toBeVisible()
  })

  test('supports keyboard activation and visible focus', async ({ page }) => {
    await page.goto('/')
    const intentButton = specimen(page, 'Intent').getByRole('button', { name: /Done/i })
    await intentButton.focus()
    await expect(intentButton).toBeFocused()
    await expect(intentButton).toHaveCSS('outline-style', 'solid')
    await page.keyboard.press('Enter')
    await expect(specimen(page, 'Intent').getByText('State: Confirmed')).toBeVisible()
  })

  test('keeps stable primary targets at or above 44 CSS pixels', async ({ page }) => {
    await page.goto('/')
    const intentButton = specimen(page, 'Intent').locator('.adaptive-button')
    const before = await intentButton.boundingBox()
    await intentButton.hover()
    const after = await intentButton.boundingBox()
    expect(before).not.toBeNull()
    expect(after).not.toBeNull()
    expect(Math.abs(before!.x - after!.x)).toBeLessThanOrEqual(1)
    expect(Math.abs(before!.y - after!.y)).toBeLessThanOrEqual(1)
    expect(Math.abs(before!.width - after!.width)).toBeLessThanOrEqual(1)
    expect(Math.abs(before!.height - after!.height)).toBeLessThanOrEqual(1)

    for (const button of await page.locator('.demo-card .adaptive-button').all()) {
      await expectMinimumTarget(button)
    }
  })

  test('reflows at 320 CSS pixels without blocking horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 })
    await page.goto('/')
    await expectNoHorizontalOverflow(page)
    await expect(specimen(page, 'Ethical').getByRole('button', { name: /^Publish/i })).toBeVisible()
  })

  test('survives increased text size without clipping essential controls', async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 900 })
    await page.goto('/')
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%'
    })
    await expectNoHorizontalOverflow(page)
    await expect(specimen(page, 'Reversible').getByRole('button', { name: /^Archive/i })).toBeVisible()
  })

  test('uses safe external link relationships', async ({ page }) => {
    await page.goto('/')
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
    await page.goto('/')
    await expect(page.locator('.app-shell')).toHaveAttribute('data-low-effects', 'true')
    await expect(specimen(page, 'Breathing').getByText('State: Ready')).toBeVisible()
    await expect(page.locator('.demo-card').first()).toHaveCSS('backdrop-filter', 'none')
  })
})
