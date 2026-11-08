import { expect, test } from '@playwright/test'
import type {} from '../browser/harness'

for (const width of [1440, 390]) {
  for (const placement of ['right', 'bottom']) {
    test(`preview rail retains ${placement} tail at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 })
      if (width === 390) await page.emulateMedia({ reducedMotion: 'reduce' })
      const errors: string[] = []
      page.on('pageerror', error => errors.push(error.message))
      await page.goto(`/?layout=reel&defer&previewPlacement=${placement}`)
      await expect(page.locator('body')).toHaveAttribute('data-ready', 'true')
      await page.evaluate(() => {
        window.__vibe.setReelPreviews(true)
        window.__vibe.navigateToReelItem({ postId: 36, mediaId: '36-0' })
      })
      const rail = page.getByRole('complementary', { name: 'Upcoming reel items' })
      await expect(rail).toBeVisible()
      await expect.poll(() => page.locator('.reel-viewport').evaluate(element => element.getAnimations().length)).toBe(0)
      const size = await rail.boundingBox()
      await page.getByRole('button', { name: 'Open upcoming item 4', exact: true }).click()
      await expect(page.locator('.reel-feed')).toHaveAttribute('data-active-post-id', '40')
      await expect(page.locator('[data-preview-post-id]')).toHaveCount(0)
      await expect(page.locator('.reel-feed')).not.toHaveAttribute('data-preview-jump', '')
      await expect(rail).toBeVisible()
      await expect.poll(() => rail.boundingBox()).toEqual(size)
      const load = rail.getByRole('button', { name: 'Load more', exact: true })
      await page.screenshot({ path: `test-results/rail-load-more-${placement}-${width}.png` })
      await load.click()
      await expect(rail.getByRole('status')).toHaveText('Loading previews…')
      await expect(rail.locator('.reel-preview-spinner')).toBeVisible()
      await expect(load).toHaveCount(0)
      expect(await page.evaluate(() => window.__requests)).toBe(1)
      await page.screenshot({ path: `test-results/rail-loading-${placement}-${width}.png` })
      await page.evaluate(() => window.__resolvePage?.())
      await expect(page.locator('[data-preview-post-id]').first()).toHaveAttribute('data-preview-post-id', '100')
      await expect(rail.getByRole('status')).toHaveCount(0)
      await page.evaluate(() => window.__vibe.navigateToReelItem({ postId: 109, mediaId: '109-0' }))
      await expect(rail.getByRole('status')).toHaveText('End of feed')
      await expect(rail).toBeVisible()
      await expect.poll(() => rail.boundingBox()).toEqual(size)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      expect(errors).toEqual([])
    })
  }
}
