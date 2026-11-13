import { expect, test } from '@playwright/test'
import type {} from '../browser/harness'

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`defers masonry host callbacks during a wheel gesture with motion ${reducedMotion}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion })
    await page.goto('/?layout=masonry&infinite&defer')
    await expect(page.locator('body')).toHaveAttribute('data-ready', 'true')
    const feed = page.locator('.masonry-feed')
    const observations = () => page.evaluate(() => window.__masonryObservations)
    await expect.poll(async () => (await observations()).fullyVisible.length).toBeGreaterThan(0)
    const initial = await observations()

    await feed.hover()
    await page.mouse.wheel(0, 180)
    await page.mouse.wheel(0, 1300)
    await page.mouse.wheel(0, 10000)
    await expect.poll(async () => (await observations()).pages).toEqual([false])

    const settled = await observations()
    expect(settled.changes).toContain(true)
    expect(settled.changes.at(-1)).toBe(false)
    await expect.poll(async () => (await observations()).fullyVisible.length)
      .toBeGreaterThan(initial.fullyVisible.length)
    expect((await observations()).fullyVisible.every(entry => !entry.scrolling)).toBe(true)
    await page.evaluate(() => window.__resolvePage?.())
  })
}
