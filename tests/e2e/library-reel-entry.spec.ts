import { expect, test, type Page } from '@playwright/test'
import type {} from '../browser/harness'

async function open(page: Page) {
  await page.goto('/?layout=masonry')
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true')
  await expect(page.locator('.masonry-item').first().locator('img'))
    .toHaveClass(/media-preview--ready/)
}

// Pause the real CSS transition at its midpoint rather than depending on machine speed.
async function midpoint(page: Page, phase: 'enter' | 'leave') {
  return page.evaluate((phase) => new Promise<{
    opacity: number, x: number, positions: number[], width: number, overflow: boolean,
  }>((resolve) => {
    const onRun = (event: TransitionEvent) => {
      const overlay = event.target as HTMLElement
      if (!overlay.classList.contains('vibe-reel-overlay') || event.propertyName !== 'transform') return
      document.removeEventListener('transitionrun', onRun)
      const animation = overlay.getAnimations().find((candidate) => (
        candidate instanceof CSSTransition && candidate.transitionProperty === 'transform'
      ))!
      animation.pause()
      const duration = Number(animation.effect!.getTiming().duration)
      const positions = [0.25, 0.5, 0.75].map((progress) => {
        animation.currentTime = duration * progress
        return overlay.getBoundingClientRect().x
      })
      animation.currentTime = duration / 2
      const rect = overlay.getBoundingClientRect()
      const style = getComputedStyle(overlay)
      resolve({
        opacity: Number(style.opacity), positions,
        x: rect.x, width: rect.width,
        overflow: document.documentElement.scrollWidth > innerWidth,
      })
    }
    document.addEventListener('transitionrun', onRun)
    if (phase === 'enter') (document.querySelector('.masonry-item') as HTMLElement).click()
    else document.querySelector('.vibe-reel-overlay')!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    )
  }), phase)
}

async function finishTransition(page: Page) {
  await page.locator('.vibe-reel-overlay').evaluate((overlay) => {
    for (const animation of overlay.getAnimations()) animation.finish()
  })
}

for (const width of [1440, 390]) {
  test(`reel entry preserves slide and media motion timing at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 844 })
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    let release!: () => void
    const held = new Promise<void>((resolve) => { release = resolve })
    await page.route('**/media/1-0-original.svg', async (route) => {
      await held
      await route.fulfill({ contentType: 'image/svg+xml', body:
        '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600"><rect width="400" height="600" fill="#64748b"/></svg>',
      })
    })
    try {
      await open(page)
      const sample = await midpoint(page, 'enter')
      expect(sample.opacity).toBe(1)
      expect(sample.x).toBeGreaterThan(-width)
      expect(sample.x).toBeLessThan(0)
      expect(sample.positions[0]!).toBeLessThan(sample.positions[1]!)
      expect(sample.positions[1]!).toBeLessThan(sample.positions[2]!)
      expect(sample.width).toBe(width)
      expect(sample.overflow).toBe(false)
      const overlay = page.locator('.vibe-reel-overlay')
      const image = overlay.locator('.reel-item[data-post-id="1"] img')
      await expect(overlay.locator('[data-post-id="1"] [data-test=media-loading]')).toBeVisible()
      await expect(image).toHaveCSS('transform', 'matrix(1.01, 0, 0, 1.01, 0, 0)')
      await expect(image).toHaveCSS('opacity', '0')
      await expect(image).toHaveCSS('transition-property', 'opacity, transform')
      await expect(image).toHaveCSS('transition-duration', '0.16s, 0.16s')
      await expect(image).toHaveCSS('transition-timing-function', 'ease-out, ease-out')
      await finishTransition(page)
      release()
      await expect(image).toHaveClass(/media-preview--ready/)
      await expect(image).toHaveCSS('opacity', '1')
      await expect(image).toHaveCSS('transform', 'none')
      expect(await image.evaluate((element) => element.getAnimations().length)).toBe(0)
      await page.screenshot({ path: testInfo.outputPath(`reel-entry-${width}.png`) })

      const exit = await midpoint(page, 'leave')
      expect(exit.opacity).toBe(1)
      expect(exit.x).toBeGreaterThan(-width)
      expect(exit.x).toBeLessThan(0)
      expect(exit.positions[0]!).toBeGreaterThan(exit.positions[1]!)
      expect(exit.positions[1]!).toBeGreaterThan(exit.positions[2]!)
      await finishTransition(page)
      await expect(overlay).toHaveCount(0)
      await expect(page.locator('.masonry-item').first()).toBeFocused()

      await midpoint(page, 'enter')
      await expect(image).toHaveCSS('opacity', '1')
      await expect(image).toHaveCSS('transform', 'none')
      expect(await image.evaluate((element) => element.getAnimations().length)).toBe(0)
      await finishTransition(page)
      await page.keyboard.press('Escape')
      await expect(overlay).toHaveCount(0)
    } finally { release() }
  })

  test(`reel entry supports Escape interruption and reduced motion at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await open(page)
    await midpoint(page, 'enter')
    await page.keyboard.press('Escape')
    const overlay = page.locator('.vibe-reel-overlay')
    await expect(overlay).toHaveCount(0)
    const card = page.locator('.masonry-item').first()
    await expect(card).toBeFocused()
    await card.press('Enter')
    await expect(overlay).toBeFocused()
    await expect(overlay).toHaveCSS('opacity', '1')
    await page.keyboard.press('Escape')
    await expect(overlay).toHaveCount(0)

    await page.emulateMedia({ reducedMotion: 'reduce' })
    await card.press('Enter')
    await expect(overlay).toBeVisible()
    await expect(overlay).toHaveCSS('opacity', '1')
    await expect(overlay).toHaveCSS('transform', 'none')
    expect(await overlay.evaluate((element) => element.getAnimations().length)).toBe(0)
    await page.keyboard.press('Escape')
    await expect(overlay).toHaveCount(0)
    await expect(card).toBeFocused()
  })
}
