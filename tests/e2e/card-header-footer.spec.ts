import { expect, test } from '@playwright/test'

test('custom feed footer exposes autofill, pause, error, retry, and end states', async ({
  page,
}) => {
  test.setTimeout(60_000)
  await page.goto('/demos/card-header-and-footer')
  const byTest = (name: string) => page.locator(`[data-test="${name}"]`)

  await expect(byTest('grouping-contract')).toContainText(
    'one grouped VibeItem per post',
  )
  const footer = byTest('demo-feed-footer')
  await expect(footer).toBeVisible()
  await expect(byTest('demo-feed-footer-progress')).toHaveText('45 / 500')
  await expect(byTest('demo-feed-footer-requests')).toHaveText('1 request')
  await expect(byTest('demo-feed-footer-status')).toHaveText('Waiting')
  await expect(byTest('demo-feed-footer-countdown')).toContainText('Next in')

  await byTest('demo-feed-footer-cancel').click()
  await expect(byTest('demo-feed-footer-status')).toHaveText(
    'Autofill cancelled',
  )
  await byTest('demo-feed-footer-restart').click()
  await expect(byTest('demo-feed-footer-status')).toHaveText(
    'End of feed',
    { timeout: 25_000 },
  )

  const infoAction = page.getByRole('button', { name: /Show information for post/ }).first()
  const loveAction = page.getByRole('button', { name: 'Love' }).first()
  await expect(infoAction).toBeVisible()
  await infoAction.click()
  await expect(page.locator('.demo-card-details').first()).toBeVisible()
  await loveAction.click()
  await expect(loveAction).toHaveAttribute('aria-pressed', 'true')

  await byTest('card-demo-pause').click()
  await expect(byTest('demo-feed-footer-status')).toHaveText(
    'Load more paused',
  )
  await byTest('card-demo-pause').click()
  await expect(byTest('demo-feed-footer-status')).toHaveText('End of feed')

  await byTest('demo-feed-footer-fail-retry').click()
  await expect(byTest('demo-feed-footer-status')).toHaveText('Request failed')
  await byTest('demo-feed-footer-retry').click()
  await expect(byTest('demo-feed-footer-status')).toHaveText('End of feed')
})

test('custom feed footer remains usable in the narrow reel layout', async ({ page }) => {
  test.setTimeout(60_000)
  await page.setViewportSize({ width: 430, height: 932 })
  await page.goto('/demos/card-header-and-footer')
  const byTest = (name: string) => page.locator(`[data-test="${name}"]`)

  await expect(byTest('demo-feed-footer')).toBeVisible()
  await expect(byTest('demo-feed-footer-progress')).toHaveText('45 / 500')
  await expect(byTest('demo-feed-footer-cancel')).toBeVisible()
  await expect(byTest('demo-feed-footer-status')).toHaveText(
    'End of feed',
    { timeout: 35_000 },
  )
  const reel = page.locator('[data-layout-mode="reel"]')
  await expect(reel).toBeVisible()
  await reel.evaluate((element) => { element.scrollTop = element.scrollHeight })
  await expect(byTest('demo-feed-footer')).toBeVisible()
  expect(await page.locator('.card-chrome-demo-stage').evaluate((element) => (
    element.scrollWidth <= element.clientWidth
  ))).toBe(true)
})
