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

test('feed dragging does not select card content', async ({ page }) => {
  await page.goto('/demos/card-header-and-footer')

  const firstCard = page.locator('.masonry-item').first()
  await expect(firstCard).toBeVisible()
  const bounds = await firstCard.boundingBox()
  expect(bounds).not.toBeNull()

  await page.mouse.move(bounds!.x + 16, bounds!.y + 16)
  await page.mouse.down()
  await page.mouse.move(
    bounds!.x + bounds!.width - 16,
    bounds!.y + bounds!.height - 16,
    { steps: 12 },
  )
  await page.mouse.up()

  expect(await page.evaluate(() => window.getSelection()?.toString() ?? ''))
    .toBe('')
})

test('masonry reels enter and leave with the left sheet transition', async ({
  page,
}) => {
  await page.goto('/demos/card-header-and-footer')

  const firstCard = page.locator('.masonry-item').first()
  await expect(firstCard).toBeVisible()
  await firstCard.locator('.media-card-activator').click()
  const overlay = page.locator('.vibe-reel-overlay')
  await expect(overlay).toBeVisible()
  await expect.poll(() => overlay.evaluate((element) => (
    element.getAnimations().some((animation) => (
      animation instanceof CSSTransition
      && animation.transitionProperty === 'transform'
      && animation.effect?.getTiming().duration === 160
    ))
  )), { timeout: 300 }).toBe(true)

  await page.keyboard.press('Escape')
  await expect.poll(() => overlay.evaluate((element) => (
    element.getAnimations().some((animation) => (
      animation instanceof CSSTransition
      && animation.transitionProperty === 'transform'
      && animation.effect?.getTiming().duration === 160
    ))
  )), { timeout: 300 }).toBe(true)
  await expect(overlay).toHaveCount(0)
})

test('reduced motion removes masonry reel travel', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/demos/card-header-and-footer')

  await page.locator('.masonry-item').first()
    .locator('.media-card-activator').click()
  const overlay = page.locator('.vibe-reel-overlay')
  await expect(overlay).toBeVisible()
  expect(await overlay.evaluate((element) => (
    element.getAnimations().some((animation) => (
      animation instanceof CSSTransition
      && animation.transitionProperty === 'transform'
    ))
  ))).toBe(false)
})
