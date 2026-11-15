import { expect, test } from '@playwright/test'
import { capture, ready } from './showcaseSupport'

for (const [width, reducedMotion] of [[1440, 'no-preference'], [390, 'reduce']] as const) {
  test(`switches feed layouts at ${width}px and returns from the reel to the list`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await page.emulateMedia({ reducedMotion })
    const errors = await ready(page)
    const masonry = page.getByRole('button', { name: 'Masonry view' })
    const list = page.getByRole('button', { name: 'List view' })
    const feed = page.locator('.masonry-feed')
    const rows = feed.locator('.masonry-item')
    const loaded = page.locator('[data-test=loaded-count]')
    const count = await loaded.textContent()
    const first = rows.first()
    const postId = await first.getAttribute('data-post-id')

    await expect(masonry).toHaveAttribute('aria-pressed', 'true')
    await list.focus()
    await list.press('Enter')
    await expect(list).toHaveAttribute('aria-pressed', 'true')
    await expect(list).toBeFocused()
    await expect(feed).toHaveAttribute('data-layout-mode', 'list')
    await expect(first).toHaveAttribute('data-post-id', postId!)
    await expect(loaded).toHaveText(count!)
    await expect.poll(async () => {
      const [one, two, thumbnail] = await Promise.all([
        first.boundingBox(), rows.nth(1).boundingBox(),
        first.locator('.media-card-media').boundingBox(),
      ])
      return Boolean(one && two && thumbnail
        && one.x === two.x && one.y + one.height < two.y
        && one.height === thumbnail.height && thumbnail.width === thumbnail.height)
    }).toBe(true)
    await capture(page, `vibe-list-${width}`)

    await first.locator('.media-card-activator').click()
    await expect(page.locator('.reel-feed')).toHaveAttribute('data-active-post-id', postId!)
    await page.getByRole('button', { name: 'Back to feed' }).click()
    await expect(page.locator('.vibe-reel-overlay')).toHaveCount(0)
    await expect(feed).toHaveAttribute('data-layout-mode', 'list')
    await expect(list).toHaveAttribute('aria-pressed', 'true')

    await masonry.click()
    await expect(feed).toHaveAttribute('data-layout-mode', 'masonry')
    await expect(masonry).toHaveAttribute('aria-pressed', 'true')
    await expect(loaded).toHaveText(count!)
    await expect.poll(async () => {
      const [one, two] = await Promise.all([first.boundingBox(), rows.nth(1).boundingBox()])
      return Boolean(one && two && one.x < two.x && Math.abs(one.y - two.y) < 1)
    }).toBe(true)
    await capture(page, `vibe-masonry-${width}`)
    expect(errors).toEqual([])
  })
}
