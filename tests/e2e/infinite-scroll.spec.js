import { expect, test } from '@playwright/test'

test('loads next page when scrolling to bottom', async ({ page }) => {
  await page.goto('/')

  const scroller = page.getByTestId('items-scroll-container')
  const cards = page.getByTestId('item-card')

  await expect(cards).toHaveCount(20)

  // Scroll near bottom to trigger prefetch
  await scroller.evaluate((el) => {
    el.scrollTop = el.scrollHeight
  })

  await expect(cards).toHaveCount(40)
})
