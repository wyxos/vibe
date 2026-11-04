import { expect, test } from '@playwright/test'
import { capture, ready } from './showcaseSupport'

for (const width of [1440, 390]) test(`preview buttons activate their reel items at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 844 })
  if (width === 390) await page.emulateMedia({ reducedMotion: 'reduce' })
  const errors = await ready(page)
  await page.locator('.masonry-item .media-card-activator').first().click()
  await expect(page.locator('.vibe-reel-overlay')).toHaveAttribute('data-reel-entry', 'ready')
  await page.getByRole('button', { name: 'Upcoming previews', exact: true }).click()
  const feed = page.locator('.reel-feed')
  const preview = page.getByRole('button', { name: 'Open upcoming item 2', exact: true })
  const postId = await preview.locator('..').getAttribute('data-preview-post-id')
  if (width === 390) await preview.click()
  else await preview.press('Enter')
  await expect(feed).toHaveAttribute('data-active-post-id', postId!)
  await expect(feed).toBeFocused()
  await expect(feed).not.toHaveAttribute('data-transitioning', '')
  await expect(page.locator('.reel-preview-list [data-preview-post-id]')).toHaveCount(4)
  await capture(page, `vibe-preview-selection-${width}`)
  expect(errors).toEqual([])
})
