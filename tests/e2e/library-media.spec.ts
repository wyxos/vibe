import { expect, test, type Page } from '@playwright/test'
import type {} from '../browser/harness'

async function open(page: Page, query: string) {
  await page.goto(`/?${query}`)
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true')
}

test('retry is styled, guarded and activation-safe for pointer and keyboard', async ({ page }) => {
  let release: (() => void) | undefined
  let attempts = 0
  await page.route('**/broken.jpg', async (route) => {
    attempts++
    if (attempts > 1) await new Promise<void>((resolve) => { release = resolve })
    await route.fulfill({ status: 401, body: 'Synthetic failure', contentType: 'text/plain' })
  })
  await open(page, 'scenario=error')
  const error = page.locator('[data-test=media-error]')
  const retry = error.locator('[data-test=media-retry]')
  await expect(error).toHaveAttribute('aria-label', 'Error Preview unavailable')
  await expect(retry).toHaveCSS('cursor', 'pointer')
  await expect(retry).toHaveCSS('min-height', '32px')
  const generation = await error.locator('..').locator('img').getAttribute('data-source-generation')
  await retry.click()
  await expect.poll(() => attempts).toBe(2)
  await expect(retry).toBeDisabled()
  await expect(retry).toHaveText('Retrying…')
  await expect(error).toHaveAttribute('aria-busy', 'true')
  await expect(error.locator('..').locator('img')).not.toHaveAttribute('data-source-generation', generation!)
  await expect(page.locator('.vibe-reel-overlay')).toHaveCount(0)
  release?.()
  await expect(retry).toBeEnabled()
  await retry.focus()
  await page.keyboard.press('Tab')
  await page.keyboard.press('Shift+Tab')
  await expect(retry).toBeFocused()
  expect(await retry.evaluate((button) => button.matches(':focus-visible'))).toBe(true)
  await retry.press('Enter')
  await expect.poll(() => attempts).toBe(3)
  await expect(retry).toBeDisabled()
  release?.()
  await expect(retry).toBeEnabled()
  await expect(page.locator('.vibe-reel-overlay')).toHaveCount(0)
})

test('audio uses covers and fallbacks in masonry without mounting playback controls', async ({ page }) => {
  await open(page, 'scenario=audio&layout=masonry')
  await expect(page.locator('.media-audio-cover')).toHaveCount(1)
  await expect(page.locator('.media-audio-fallback')).toHaveCount(1)
  await expect(page.locator('audio')).toHaveCount(0)
  await expect(page.locator('.media-controls')).toHaveCount(0)
})

test('audio playback controls follow the active reel post', async ({ page }) => {
  await open(page, 'scenario=audio&layout=reel')
  const reel = page.locator('.reel-feed')
  const host = page.locator('[data-test=reel-media-controls-host]')
  await expect(reel.locator('[data-post-id=covered-audio] audio')).toHaveCount(1)
  await expect(host.getByRole('button', { name: 'Play audio', exact: true })).toBeVisible()
  await page.evaluate(() => window.__vibe.nextReelPost())
  await expect(reel).toHaveAttribute('data-active-post-id', 'uncovered-audio')
  await expect(host.locator('[data-control-post-id=uncovered-audio]')).toBeVisible()
  await expect(reel.locator('.media-controls')).toHaveCount(0)
})

for (const width of [1440, 700]) {
  test(`Escape exits a feed-opened reel after seeking at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await open(page, 'scenario=video&layout=masonry')
    const card = page.locator('.masonry-item').first()
    await expect(card.locator('video')).toHaveClass(/media-preview--ready/)
    await card.click()
    const overlay = page.locator('.vibe-reel-overlay')
    const seek = overlay.getByRole('slider', { name: 'Seek video' })
    await expect(seek).toBeEnabled()
    await overlay.getByRole('button', { name: 'Pause video' }).click()
    await seek.click()
    const previous = Number(await seek.inputValue())
    await seek.press('ArrowRight')
    expect(Number(await seek.inputValue())).toBeGreaterThan(previous)
    await expect(overlay).toBeVisible()
    await seek.press('Escape')
    await expect(overlay).toHaveCount(0)
    await expect(card).toBeFocused()
  })
}

for (const width of [1440, 390]) {
  test(`video controls stay anchored and contained at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await open(page, 'scenario=mixed&layout=reel')
    const reel = page.locator('.reel-feed')
    const host = page.locator('[data-test=reel-media-controls-host]')
    await expect(host.locator('.media-controls')).toHaveCount(0)
    await page.evaluate(() => window.__vibe.nextReelPost())
    await expect(reel).toHaveAttribute('data-active-post-id', '2')
    const controls = host.locator('.media-controls')
    await expect(controls).toBeVisible()
    await expect(controls).not.toHaveClass(/vibe-reel-media-controls-enter-active/)
    const active = reel.locator('[data-post-id="2"] video')
    await expect.poll(() => active.evaluate((video: HTMLVideoElement) => ({
      autoplay: video.autoplay, muted: video.muted,
    }))).toEqual({ autoplay: true, muted: false })
    await expect.poll(async () => {
      const box = await reel.boundingBox()
      const controlsBox = await controls.boundingBox()
      if (!box || !controlsBox) return Infinity
      return Math.max(Math.abs(controlsBox.x - box.x), Math.abs(
        (controlsBox.y + controlsBox.height) - (box.y + box.height),
      ))
    }).toBeLessThanOrEqual(1)
    const box = await reel.boundingBox()
    for (const control of await controls.locator('button:visible, input:visible').all()) {
      const child = await control.boundingBox()
      expect(child!.y + child!.height).toBeLessThanOrEqual(box!.y + box!.height)
    }
    await expect(active).toHaveCSS('cursor', 'default')
    await expect(controls).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
    await expect(controls.locator('.media-control-seek')).toHaveCSS('cursor', 'pointer')
    await page.evaluate(() => window.__vibe.previousReelPost())
    await expect(host.locator('.media-controls')).toHaveCount(0)
    await expect.poll(() => active.evaluate((video: HTMLVideoElement) => ({
      autoplay: video.autoplay, muted: video.muted, paused: video.paused,
    }))).toEqual({ autoplay: false, muted: true, paused: true })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })
}

test('auto advance can include grouped media before the next post', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await open(page, 'layout=reel')
  await page.evaluate(() => window.__vibe.setReelAutoAdvance({ enabled: true, includePostItems: true, intervalMs: 3000 }))
  const reel = page.locator('.reel-feed')
  await expect(page.getByRole('timer')).toBeVisible()
  await expect(reel).toHaveAttribute('data-active-media-index', '1', { timeout: 6000 })
  await expect(reel).toHaveAttribute('data-active-post-id', '1')
  await page.evaluate(() => window.__vibe.setReelAutoAdvance(false))
  await expect(page.getByRole('timer')).toHaveCount(0)
})
