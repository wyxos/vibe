import { expect, test } from '@playwright/test'
import type {} from '../browser/harness'

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`animated reel selection stays on its destination (${reducedMotion})`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion })
    await page.goto('/?layout=reel&chrome')
    await expect(page.locator('body')).toHaveAttribute('data-ready', 'true')
    const result = await page.evaluate(async () => {
      const feed = document.querySelector<HTMLElement>('.reel-feed')!
      const destination = String(window.__state.items[1]!.postId)
      const samples: string[] = []
      let complete: () => void
      const settled = new Promise<void>(resolve => { complete = resolve })
      const observer = new MutationObserver(records => {
        if (records.some(record => record.attributeName === 'data-active-post-id')) samples.push(feed.dataset.activePostId!)
        if (!feed.hasAttribute('data-transitioning')) complete()
      })
      observer.observe(feed, { attributes: true, attributeFilter: ['data-active-post-id', 'data-transitioning'] })
      window.__vibe.nextReelPost()
      await settled
      observer.disconnect()
      return { samples, destination, final: feed.dataset.activePostId }
    })
    expect(result.samples.length).toBeGreaterThan(0)
    expect(result.samples.every(id => id === result.destination)).toBe(true)
    expect(result.final).toBe(result.destination)
  })
}
