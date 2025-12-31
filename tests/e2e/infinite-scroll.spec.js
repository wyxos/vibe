import { expect, test } from '@playwright/test'

test('loads next page when scrolling to bottom', async ({ page }) => {
  await page.goto('/#/')

  const scroller = page.getByTestId('items-scroll-container')

  await expect(page.getByText('Pages loaded: 1')).toBeVisible()

  // Scroll near bottom to trigger prefetch
  await scroller.evaluate((el) => {
    el.scrollTop = el.scrollHeight
  })

  await expect(page.getByText('Pages loaded: 2')).toBeVisible()
})
