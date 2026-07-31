import { expect, test } from '@playwright/test'

test('card header and footer remain focused on custom card chrome', async ({
  page,
}) => {
  await page.goto('/demos/card-header-and-footer')

  const firstCard = page.locator('.masonry-item').first()
  const firstHeader = firstCard.locator('.media-card-header')
  const firstFooter = firstCard.locator('.media-card-footer')
  await expect(firstCard).toBeVisible()
  await expect(firstCard).toHaveClass(/media-card--transparent-chrome/)
  await expect(firstHeader).toHaveClass(/media-card-region--transparent/)
  await expect(firstFooter).toHaveClass(/media-card-region--transparent/)
  expect(await firstCard.evaluate((element) => (
    getComputedStyle(element).backgroundColor
  ))).toBe('rgba(0, 0, 0, 0)')
  expect(await firstHeader.evaluate((element) => (
    getComputedStyle(element).backgroundColor
  ))).toBe('rgba(0, 0, 0, 0)')

  const infoAction = page.getByRole('button', {
    name: /Show information for post/,
  }).first()
  const loveAction = page.getByRole('button', { name: 'Love' }).first()
  await expect(infoAction).toBeVisible()
  await infoAction.click()
  await expect(page.locator('.demo-card-details').first()).toBeVisible()
  await loveAction.click()
  await expect(loveAction).toHaveAttribute('aria-pressed', 'true')

  await expect(page.locator('[data-test="card-remove"]')).toHaveCount(0)
  await expect(page.locator('[data-test="remove-random-items"]')).toHaveCount(0)
  await expect(page.locator('[data-test="demo-feed-footer"]')).toHaveCount(0)
})

test('card chrome remains usable in the narrow reel layout', async ({ page }) => {
  await page.setViewportSize({ width: 430, height: 932 })
  await page.goto('/demos/card-header-and-footer')

  const reel = page.locator('[data-layout-mode="reel"]')
  await expect(reel).toBeVisible()
  await expect(reel.locator('.media-card-header').first()).toBeVisible()
  await expect(reel.locator('.media-card-footer').first()).toBeVisible()
  await expect(page.locator('[data-test="card-remove"]')).toHaveCount(0)
  await expect(page.locator('[data-test="demo-feed-footer"]')).toHaveCount(0)
  expect(await page.locator('.demo-stage').evaluate((element) => (
    element.scrollWidth <= element.clientWidth
  ))).toBe(true)
})
