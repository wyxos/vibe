import { expect, test } from '@playwright/test'

test('backfill example loads and can fetch more on scroll', async ({ page }) => {
  await page.goto('/#/examples/backfill')

  await expect(page.getByRole('heading', { name: 'Backfill' })).toBeVisible()
  await expect(page.getByTestId('pages-loaded')).toBeVisible()

  const scroller = page.getByTestId('items-scroll-container')

  // Wait until the container is actually scrollable.
  await page.waitForFunction(() => {
    const el = document.querySelector('[data-testid="items-scroll-container"]') as HTMLElement | null
    if (!el) return false
    return el.scrollHeight > el.clientHeight + 50
  })

  // Scroll near bottom to trigger prefetch
  await scroller.evaluate((el) => {
    el.scrollTop = Math.max(0, el.scrollHeight - el.clientHeight)
  })

  // Pages loaded label should eventually include 2.
  await expect(page.getByTestId('pages-loaded')).toHaveText(/2/, { timeout: 15000 })
})

test('resize triggers relayout without losing items', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 800 })
  await page.goto('/#/')

  await page.waitForFunction(() => document.querySelectorAll('[data-testid="item-card"]').length >= 6)

  const xPositionsWide = await page.$$eval('[data-testid="item-card"]', (cards) =>
    cards.slice(0, 8).map((c) => (c as HTMLElement).getBoundingClientRect().x)
  )

  await page.setViewportSize({ width: 520, height: 800 })

  // Wait for ResizeObserver-driven relayout.
  await page.waitForFunction(
    (before) => {
      const cards = Array.from(document.querySelectorAll('[data-testid="item-card"]')) as HTMLElement[]
      const now = cards.slice(0, 8).map((c) => c.getBoundingClientRect().x)
      return now.some((x, i) => Math.abs(x - (before[i] ?? x)) > 1)
    },
    xPositionsWide
  )

  // Sanity: still have cards.
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="item-card"]').length > 0)
})
