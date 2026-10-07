import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'

const video = readFileSync(new URL('../fixtures/synthetic-video.mp4', import.meta.url))

for (const width of [1440, 700]) {
  test(`Escape exits a feed-opened reel after seeking at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.route('**/data/civitai/images/page-*.json', (route) => route.fulfill({
      json: {
        items: route.request().url().endsWith('page-01.json')
          ? [{ postId: 1, url: '/escape-fixture.mp4', width: 320, height: 180 }]
          : [],
        metadata: { nextCursor: null },
      },
    }))
    await page.route('**/escape-fixture.mp4', (route) => route.fulfill({
      body: video, contentType: 'video/mp4',
    }))
    await page.goto('/demos/reel-info-sheet')
    await expect(page.locator('.demo-vibe-host .masonry-item video')).toHaveClass(/media-preview--ready/)
    const card = page.locator('.demo-vibe-host .masonry-item').first()
    await expect(card).toBeVisible()
    await card.click()
    const overlay = page.locator('.vibe-reel-overlay')
    await expect(overlay).toBeVisible()
    const seek = overlay.getByRole('slider', { name: 'Seek video' })
    await expect(seek).toBeEnabled()
    await overlay.getByRole('button', { name: 'Pause video' }).click()
    await seek.click()
    await expect(seek).toBeFocused()
    const previous = Number(await seek.inputValue())
    await seek.press('ArrowRight')
    expect(Number(await seek.inputValue())).toBeGreaterThan(previous)
    await expect(overlay).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
    await page.screenshot({ path: test.info().outputPath(`focused-seek-${width}.png`) })
    await seek.press('Escape')
    await expect(overlay).toHaveCount(0)
    await expect(card).toBeFocused()
    await page.screenshot({ path: test.info().outputPath(`returned-feed-${width}.png`) })
    expect(errors).toEqual([])
  })
}
