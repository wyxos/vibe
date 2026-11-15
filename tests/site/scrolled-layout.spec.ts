import { expect, test } from '@playwright/test'
import { ready } from './showcaseSupport'

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`keeps the visible post when switching a scrolled feed with motion ${reducedMotion}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 844 })
    await page.emulateMedia({ reducedMotion })
    await ready(page)
    const feed = page.locator('.masonry-feed')
    for (let count = 36; count <= 108; count += 18) {
      await feed.evaluate(element => { element.scrollTop = element.scrollHeight })
      await expect(page.locator('[data-test=loaded-count]')).toHaveText(String(count))
    }
    await feed.evaluate(element => { element.scrollTop = element.scrollHeight * 0.78 })
    await expect.poll(() => feed.locator('.masonry-item.media-card--entering').count()).toBe(0)

    for (const mode of ['list', 'masonry']) {
      const result = await feed.evaluate(async (element, destination) => {
        const top = element.getBoundingClientRect().top
        const visible = Array.from(element.querySelectorAll<HTMLElement>('.masonry-item:not(.media-card--entering)'))
          .map(card => ({ card, box: card.getBoundingClientRect() }))
          .filter(({ box }) => box.bottom > top && box.top < top + element.clientHeight)
        const cards = visible.filter(({ box }) => box.top >= top)
          .sort((a, b) => a.box.top - b.box.top)
        const { card, box } = cards[0]!
        const surface = card.querySelector('.media-card-content')!
        const toggle = document.querySelector<HTMLButtonElement>('button[aria-label="List view"]')!
        toggle.click()
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
        const animations = card.getAnimations({ subtree: true })
          .filter(animation => animation.id === 'vibe-layout-switch')
        const retainedDuringMotion = visible.every(({ card }) => card.isConnected)
        let middle: { width: number, top: number } | null = null
        const bounds = () => {
          const { width, top, height, left } = surface.getBoundingClientRect()
          const clip = getComputedStyle(surface).clipPath.match(/^inset\(0px ([\d.]+)px/)
          return { width: width - Number(clip?.[1] ?? 0), top, height, left }
        }
        let retracting: ReturnType<typeof bounds> | null = null
        if (animations.length) {
          for (const animation of animations) {
            animation.pause()
          }
          await Promise.all(animations.map(animation => animation.ready))
          const seek = (fraction: number) => animations.forEach(animation => {
            animation.currentTime = Number(animation.effect!.getTiming().duration) * fraction
          })
          if (destination === 'masonry') {
            seek(0.25)
            retracting = bounds()
          }
          seek(0.5)
          middle = bounds()
          const layoutAnimations = element.getAnimations({ subtree: true })
            .filter(animation => animation.id === 'vibe-layout-switch')
          layoutAnimations.forEach(animation => animation.finish())
          await Promise.all(layoutAnimations.map(animation => animation.finished))
        }
        return {
          connected: card.isConnected, retainedDuringMotion,
          before: { top: box.top, width: box.width, height: box.height, left: box.left },
          middle, retracting, after: bounds(),
        }
      }, mode)
      expect(result.connected).toBe(true)
      expect(result.after.top).toBeCloseTo(result.before.top, 0)
      if (reducedMotion === 'reduce') {
        expect(result.middle).toBeNull()
      } else {
        expect(result.retainedDuringMotion).toBe(true)
        expect(result.middle).not.toBeNull()
        expect(result.middle!.width).toBeLessThan((mode === 'list' ? result.after.width : result.before.width) / 2)
        expect(result.middle!.top).toBeCloseTo(result.before.top, 0)
        if (mode === 'masonry') {
          expect(result.retracting!.left).toBeCloseTo(result.before.left, 0)
          expect(result.retracting!.height).toBeCloseTo(result.before.height, 0)
          expect(result.retracting!.top).toBeCloseTo(result.before.top, 0)
          expect(result.retracting!.width).toBeLessThan(result.before.width - 10)
          expect(result.retracting!.width).toBeGreaterThan(result.middle!.width + 10)
        }
      }
    }
  })
}
