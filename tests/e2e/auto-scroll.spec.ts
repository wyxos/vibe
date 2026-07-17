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
