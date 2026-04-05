import { expect, gotoRoute, test } from './fixtures'

test('home viewer loads the first media page', async ({ page }) => {
  await gotoRoute(page, '/')

  const root = page.getByTestId('vibe-root')
  const title = page.getByTestId('vibe-root-title')
  const progress = page.getByTestId('vibe-root-pagination')

  await expect(root).toBeVisible()
  await expect(title).toHaveText(/\S+/, { timeout: 15_000 })
  await expect(progress).toHaveText('1 / 25')
  expect(Number(await root.getAttribute('data-rendered-count'))).toBeLessThanOrEqual(5)

  let mediaBarVisible = false

  for (let step = 0; step < 5; step += 1) {
    if (await page.getByTestId('vibe-root-media-bar').isVisible().catch(() => false)) {
      mediaBarVisible = true
      break
    }

    await page.keyboard.press('ArrowDown')
  }

  expect(mediaBarVisible).toBe(true)
  expect(Number(await root.getAttribute('data-rendered-count'))).toBeLessThanOrEqual(5)
  await expect(page.getByRole('button', { name: 'Retry' })).toHaveCount(0)
})

test('home viewer prefetches the next page without rendering the full loaded list', async ({ page }) => {
  await gotoRoute(page, '/')

  const root = page.getByTestId('vibe-root')
  const progress = page.getByTestId('vibe-root-pagination')

  await expect(progress).toHaveText('1 / 25', { timeout: 15_000 })

  for (let step = 0; step < 23; step += 1) {
    await page.keyboard.press('ArrowDown')
  }

  await expect.poll(async () => (await progress.textContent())?.trim()).toContain('/ 50')
  expect(Number(await root.getAttribute('data-rendered-count'))).toBeLessThanOrEqual(5)
})
