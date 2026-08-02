import { expect, test } from '@playwright/test'

test('auto scroll starts, pauses, resumes, and stops the masonry gallery', async ({
  page,
}) => {
  await page.goto('/demos/auto-scroll')
  const gallery = page.locator('.masonry-feed')
  await expect(gallery).toBeVisible()
  const scrollTop = () => gallery.evaluate((element) => element.scrollTop)

  const initial = await scrollTop()
  await page.getByRole('button', { name: 'Start auto scroll' }).click()
  await expect(page.getByRole('button', { name: 'Stop auto scroll' })).toBeVisible()
  await expect.poll(scrollTop).toBeGreaterThan(initial + 10)

  await page.getByRole('button', { name: 'Pause auto scroll' }).click()
  const paused = await scrollTop()
  await page.waitForTimeout(350)
  expect(await scrollTop()).toBe(paused)

  await page.getByRole('button', { name: 'Resume auto scroll' }).click()
  await expect.poll(scrollTop).toBeGreaterThan(paused + 10)

  await page.getByRole('button', { name: 'Stop auto scroll' }).click()
  const stopped = await scrollTop()
  await page.waitForTimeout(350)
  expect(await scrollTop()).toBe(stopped)
})

test('loading more can be locked at the feed boundary and resumed', async ({ page }) => {
  await page.setViewportSize({ width: 430, height: 932 })
  await page.goto('/demos/auto-scroll')
  const gallery = page.locator('.masonry-feed')
  await expect(gallery).toBeVisible()
  expect(await page.locator('.app-header').evaluate((element) => (
    element.scrollWidth <= element.clientWidth
  ))).toBe(true)

  const infiniteScroll = page.getByRole('checkbox', { name: 'Infinite scroll' })
  await infiniteScroll.evaluate((input: HTMLInputElement) => input.click())
  await expect(infiniteScroll).not.toBeChecked()
  await page.getByRole('button', { name: 'Lock loading more' }).click()
  await expect(page.getByRole('button', { name: 'Unlock loading more' }))
    .toHaveAttribute('aria-pressed', 'true')
  await gallery.evaluate((element) => { element.scrollTop = element.scrollHeight })

  const paused = page.getByRole('button', { name: 'Loading paused' })
  await expect(paused).toBeVisible()
  await expect(paused).toBeDisabled()

  await page.getByRole('button', { name: 'Unlock loading more' }).click()
  await expect(paused).toBeHidden()
})
