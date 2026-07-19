import { expect, test } from '@playwright/test'

test('reel countdown advances vertically when post items are excluded', async ({ page }) => {
  await page.goto('/demos/reel-auto-advance')
  const reel = page.locator('.reel-feed')
  await expect(reel).toBeVisible()
  const activePostId = () => reel.getAttribute('data-active-post-id')
  const firstPostId = await activePostId()
  await expect(reel.locator(`[data-post-id="${firstPostId}"] img.media-preview`))
    .toHaveAttribute('src', /\/original=true\//)

  await page.getByRole('button', { name: 'Start reel auto advance' }).click()
  await expect(page.getByRole('timer', { name: /next post in 3s/i })).toBeVisible()
  await expect.poll(activePostId, { timeout: 6_000 }).not.toBe(firstPostId)
})

test('reel countdown includes grouped post items when enabled', async ({ page }) => {
  await page.goto('/demos/reel-auto-advance')
  const reel = page.locator('.reel-feed')
  await expect(reel).toBeVisible()
  const firstPostId = await reel.getAttribute('data-active-post-id')

  const includePostItems = page.getByRole('checkbox', { name: 'Include post items' })
  await page.getByText('Include post items', { exact: true }).click()
  await expect(includePostItems).toBeChecked()
  await page.getByRole('button', { name: 'Start reel auto advance' }).click()
  await expect(page.getByRole('timer', { name: /next post item in 3s/i })).toBeVisible()
  await expect.poll(
    () => reel.getAttribute('data-active-media-index'),
    { timeout: 6_000 },
  ).toBe('1')
  expect(await reel.getAttribute('data-active-post-id')).toBe(firstPostId)
})
