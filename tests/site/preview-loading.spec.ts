import { expect, test } from '@playwright/test'
import { capture, ready } from './showcaseSupport'

for (const width of [1440, 390]) {
  test(`demo loads the final preview page automatically at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    const errors = await ready(page)
    await page.locator('.masonry-item .media-card-activator').first().click()
    await expect(page.locator('.vibe-reel-overlay')).toHaveAttribute('data-reel-entry', 'ready')
    await page.getByRole('button', { name: 'Upcoming previews', exact: true }).click()
    const rail = page.getByRole('complementary', { name: 'Upcoming reel items' })
    const count = Number(await page.locator('[data-test=loaded-count]').textContent())
    const pages = Math.ceil((count - 1) / 4)
    for (let pageIndex = 1; pageIndex < pages; pageIndex++) {
      await rail.getByRole('button', { name: 'Next previews', exact: true }).click()
    }
    await expect(rail.getByRole('button', { name: 'Load more previews', exact: true })).toHaveCount(0)
    await expect.poll(async () => Number(await page.locator('[data-test=loaded-count]').textContent())).toBeGreaterThan(count)
    await expect(rail.getByRole('button', { name: 'Next previews', exact: true })).toHaveAttribute('aria-disabled', 'false')
    await expect(rail.locator('.reel-preview-list')).toHaveCSS('transform', 'none')
    await expect(rail.locator('.reel-preview-boundary')).toHaveCount(0)
    await capture(page, `vibe-preview-automatic-${width}`)
    expect(errors).toEqual([])
  })
}
