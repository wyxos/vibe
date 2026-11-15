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
          .filter(animation => animation.effect instanceof KeyframeEffect && animation.effect.getKeyframes().length === 3)
        const retainedDuringMotion = visible.every(({ card }) => card.isConnected)
        let middle: { width: number, top: number } | null = null
        const bounds = () => {
          const { width, top } = surface.getBoundingClientRect()
          return { width, top }
        }
        if (animations.length) {
          for (const animation of animations) {
            animation.pause()
            animation.currentTime = Number(animation.effect!.getTiming().duration) * (destination === 'list' ? 0.6 : 0.4)
          }
          await Promise.all(animations.map(animation => animation.ready))
          middle = bounds()
          const layoutAnimations = element.getAnimations({ subtree: true })
            .filter(animation => animation.effect instanceof KeyframeEffect && animation.effect.getKeyframes().length === 3)
          layoutAnimations.forEach(animation => animation.finish())
          await Promise.all(layoutAnimations.map(animation => animation.finished))
        }
        return { connected: card.isConnected, retainedDuringMotion, before: { top: box.top, width: box.width }, middle, after: bounds() }
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
      }
    }
  })
}
