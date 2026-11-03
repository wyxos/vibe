import { expect, test } from '@playwright/test'
import type {} from '../browser/harness'

for (const fullscreen of [false, true]) test(`stationary pointer preserves idle controls through wheel navigation (fullscreen=${fullscreen})`, async ({ page }) => {
  await page.goto('/?scenario=controls&layout=masonry&chrome')
  await page.locator('.masonry-item').first().click()
  const reel = page.locator('.vibe-reel-overlay .reel-feed')
  const controls = page.locator('.vibe-reel-overlay .media-controls')
  await expect(controls).toBeVisible()
  if (fullscreen) {
    await controls.getByRole('button', { name: 'Video options' }).click()
    await page.getByRole('button', { name: 'Enter fullscreen' }).click()
    await expect(page.locator('.vibe-surface')).toHaveAttribute('data-reel-fullscreen', 'true')
  }
  await reel.hover({ position: { x: 350, y: 280 } })
  const box = (await reel.boundingBox())!
  await page.clock.install()
  await page.clock.fastForward(5000)
  await expect(controls).toHaveClass(/idle-hidden/)
  await page.clock.runFor(200)
  await page.mouse.wheel(0, 650)
  await page.clock.runFor(800)
  await expect(reel).toHaveAttribute('data-active-post-id', '2')
  await expect(controls.and(page.locator('.media-controls--image'))).toHaveAttribute('inert', '')
  await page.mouse.wheel(0, 650)
  await page.clock.runFor(800)
  await expect(reel).toHaveAttribute('data-active-post-id', 'covered-audio')
  await expect(controls).toHaveCount(1)
  await reel.locator('[data-post-id="covered-audio"] .media-card-media').dispatchEvent('pointermove', {
    pointerType: 'mouse', clientX: box.x + 351, clientY: box.y + 280,
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

test.describe('fullscreen touch navigation', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })

  test('swiping from an image to audio and video keeps idle controls hidden', async ({ page }) => {
    await page.goto('/?scenario=grouped-controls&layout=reel')
    await page.getByRole('button', { name: 'Image options' }).tap()
    await page.getByRole('button', { name: 'Enter fullscreen' }).tap()
    await expect(page.locator('.vibe-surface')).toHaveAttribute('data-reel-fullscreen', 'true')
    await expect(page.locator('[data-control-post-id="1"]')).toHaveAttribute('inert', '')

    const reel = page.locator('.reel-feed')
    const box = (await reel.boundingBox())!
    const touch = await page.context().newCDPSession(page)
    const point = (fraction: number) => [{ x: box.x + box.width * fraction, y: box.y + box.height / 2 }]
    try {
      for (const [index, label] of [[1, 'Audio controls'], [2, 'Video controls']] as const) {
        await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: point(0.85) })
        for (const fraction of [0.7, 0.5, 0.3, 0.12]) {
          await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: point(fraction) })
        }
        await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
        await expect(reel).toHaveAttribute('data-active-media-index', String(index))
        const controls = page.getByLabel(label, { exact: true })
        await expect(controls).toHaveAttribute('inert', '')
        await reel.locator('.media-card-media').first().evaluate(element => {
          const event = new PointerEvent('pointermove', {
            bubbles: true, pointerType: 'mouse', clientX: 40, clientY: 40, movementX: 5,
          })
          Object.defineProperty(event, 'sourceCapabilities', { value: { firesTouchEvents: true } })
          element.dispatchEvent(event)
        })
        expect(await controls.getAttribute('inert')).toBe('')
      }
    } finally {
      await touch.detach()
    }
  })
})
