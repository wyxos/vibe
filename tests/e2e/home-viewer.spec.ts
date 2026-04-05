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

test('home viewer seekbar moves the active video forward instead of snapping back', async ({ page }) => {
  await gotoRoute(page, '/')

  const progress = page.getByTestId('vibe-root-pagination')

  await expect(progress).toHaveText('1 / 25', { timeout: 15_000 })

  await page.keyboard.press('ArrowDown')
  await expect(progress).toHaveText('2 / 25')

  const activeVideo = page.locator('[data-active="true"] video')
  const seekbar = page.getByLabel('Seek active media')

  await expect(activeVideo).toBeVisible()
  await expect(seekbar).toBeVisible()

  const targetTime = await activeVideo.evaluate((video) => Math.max(video.duration * 0.5, 1))

  await seekbar.evaluate((input, nextValue) => {
    const range = input as HTMLInputElement
    range.value = String(nextValue)
    range.dispatchEvent(new Event('input', { bubbles: true }))
  }, targetTime)

  await expect.poll(async () => {
    return activeVideo.evaluate((video) => video.currentTime)
  }).toBeGreaterThan(1)
})

test('home viewer audio cover toggles playback and the seekbar moves audio forward', async ({ page }) => {
  await gotoRoute(page, '/')

  const progress = page.getByTestId('vibe-root-pagination')

  await expect(progress).toHaveText('1 / 25', { timeout: 15_000 })

  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('ArrowDown')
  await expect(progress).toHaveText('3 / 25')

  const activeAudio = page.locator('[data-active="true"] audio')
  const audioCover = page.locator('[data-active="true"] button').first()
  const seekbar = page.getByLabel('Seek active media')

  await expect(activeAudio).toHaveCount(1)
  await expect(audioCover).toBeVisible()
  await expect(seekbar).toBeVisible()

  await audioCover.click()

  await expect.poll(async () => {
    return activeAudio.evaluate((audio) => (audio.paused ? 'paused' : 'playing'))
  }).toBe('playing')

  await expect.poll(async () => {
    return activeAudio.evaluate((audio) => Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0)
  }).toBeGreaterThan(0)

  const targetTime = await activeAudio.evaluate((audio) => Math.max(audio.duration * 0.5, 1))

  await seekbar.evaluate((input, nextValue) => {
    const range = input as HTMLInputElement
    range.value = String(nextValue)
    range.dispatchEvent(new Event('input', { bubbles: true }))
  }, targetTime)

  await expect.poll(async () => {
    return activeAudio.evaluate((audio) => audio.currentTime)
  }).toBeGreaterThan(1)

  await audioCover.click()

  await expect.poll(async () => {
    return activeAudio.evaluate((audio) => (audio.paused ? 'paused' : 'playing'))
  }).toBe('paused')
})
