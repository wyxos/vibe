import { expect, test } from '@playwright/test'
import type {} from '../browser/harness'

test('stationary pointer preserves idle controls through video, image and audio wheel navigation', async ({ page }) => {
  await page.goto('/?scenario=controls&layout=masonry&chrome')
  await page.locator('.masonry-item').first().click()
  const reel = page.locator('.vibe-reel-overlay .reel-feed')
  const controls = page.locator('.vibe-reel-overlay .media-controls')
  await expect(controls).toBeVisible()
  await reel.hover({ position: { x: 350, y: 280 } })
  const box = (await reel.boundingBox())!
  await page.clock.install()
  await page.clock.fastForward(5000)
  await expect(controls).toHaveClass(/idle-hidden/)
  await page.clock.runFor(200)
  await page.mouse.wheel(0, 650)
  await page.clock.runFor(800)
  await expect(reel).toHaveAttribute('data-active-post-id', '2')
  await expect(controls).toHaveCount(0)
  await page.mouse.wheel(0, 650)
  await page.clock.runFor(800)
  await expect(reel).toHaveAttribute('data-active-post-id', 'covered-audio')
  await expect(controls).toHaveCount(1)
  await reel.locator('[data-post-id="covered-audio"] .media-card-media').dispatchEvent('pointermove', {
    pointerType: 'mouse', clientX: box.x + 350, clientY: box.y + 280,
    movementX: 0, movementY: 0,
  })
  expect(await controls.evaluate(element => element.classList.contains('media-controls--idle-hidden'))).toBe(true)
  await page.mouse.move(360, 300)
  await expect(controls).not.toHaveClass(/idle-hidden/)
})

test('idle slide clips at the media viewport bottom above the footer', async ({ page }) => {
  await page.goto('/?scenario=controls&layout=masonry&chrome')
  await page.locator('.masonry-item').first().click()
  const controls = page.locator('.vibe-reel-overlay .media-controls')
  await expect(controls).toBeVisible()
  await page.clock.install()
  await page.clock.fastForward(5000)
  await expect(controls).toHaveClass(/idle-hidden/)
  const clipping = await controls.evaluate(element => {
    const viewport = element.closest('.reel-viewport')!
    const style = getComputedStyle(viewport)
    return { overflowY: style.overflowY, clipPath: style.clipPath }
  })
  expect(clipping.overflowY === 'clip' || clipping.overflowY === 'hidden' || clipping.clipPath !== 'none').toBe(true)
})
