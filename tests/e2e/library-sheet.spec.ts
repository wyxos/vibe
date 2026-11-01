import { expect, test } from '@playwright/test'
import type {} from '../browser/harness'

for (const width of [390, 820, 1440, 1920]) {
  test(`information sheet preserves context, geometry and close behavior at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto('/')
    await expect(page.locator('body')).toHaveAttribute('data-ready', 'true')
    if (width > 600) {
      await page.locator('.masonry-item').first().click()
    }
    await page.evaluate(() => window.__vibe.setReelInfoSheet(true))
    const sheet = page.locator('[data-test=reel-info-sheet]')
    await expect(sheet).toBeVisible()
    await expect(sheet).not.toHaveClass(/vibe-info-sheet-enter-active/)
    const layout = page.locator('.reel-layout').last()
    const layoutBox = await layout.boundingBox()
    const sheetBox = await sheet.boundingBox()
    if (width >= 1440) {
      expect(sheetBox!.width / layoutBox!.width).toBeCloseTo(width >= 1920 ? 0.4 : 0.25, 2)
    } else {
      expect(Math.abs(sheetBox!.width - layoutBox!.width)).toBeLessThan(2)
    }
    if (width === 390) await expect(layout.locator('.reel-layout-main')).toHaveAttribute('inert', '')
    await sheet.evaluate((element) => { element.setAttribute('data-identity', 'retained') })
    await page.evaluate(() => window.__vibe.nextReelPost())
    await expect(sheet.locator('.test-sheet')).toHaveAttribute('data-context-post-id', '2')
    await expect(sheet).toHaveAttribute('data-identity', 'retained')
    await sheet.getByRole('button', { name: 'Close information', exact: true }).click()
    await expect(sheet).toBeHidden()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    expect(errors).toEqual([])
  })
}

test('a closed information sheet stays closed across reel reopening', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true')
  await page.locator('.masonry-item').first().click()
  await page.evaluate(() => window.__vibe.setReelInfoSheet(true))
  await expect(page.locator('[data-test=reel-info-sheet]')).toBeVisible()
  await page.evaluate(() => window.__vibe.setReelInfoSheet(false))
  await expect(page.locator('[data-test=reel-info-sheet]')).toBeHidden()
  await page.keyboard.press('Escape')
  await expect(page.locator('.vibe-reel-overlay')).toHaveCount(0)
  await page.locator('.masonry-item').nth(1).click()
  await expect(page.locator('.vibe-reel-overlay')).toBeVisible()
  await expect(page.locator('[data-test=reel-info-sheet]')).toBeHidden()
})
