import { expect, test } from '@playwright/test'

test('audio uses cover art or the disc fallback without playback in masonry', async ({
  page,
}) => {
  await page.goto('/demos/audio-media')

  await expect(page.locator('[data-layout-mode="masonry"]')).toBeVisible()
  await expect(page.locator('.media-audio-cover')).toHaveCount(1)
  await expect(page.locator('.media-audio-fallback')).toHaveCount(1)
  await expect(page.locator('audio')).toHaveCount(0)
  await expect(page.locator('.media-controls')).toHaveCount(0)
})

test('audio uses stationary custom controls and artwork in a phone reel', async ({
  page,
}) => {
  await page.setViewportSize({ height: 844, width: 390 })
  await page.goto('/demos/audio-media')

  const reel = page.locator('.reel-feed')
  const firstAudio = reel.locator('[data-post-id="covered-audio"] audio')
  await expect(reel).toBeVisible()
  await expect(firstAudio).toBeAttached()
  await firstAudio.dispatchEvent('loadedmetadata')
  await expect(reel.locator('[data-post-id="covered-audio"] .media-audio-cover'))
    .toBeVisible()
  const controlsHost = page.locator('[data-test="reel-media-controls-host"]')
  const firstControls = controlsHost.locator('[data-control-post-id="covered-audio"]')
  await expect(firstControls).toBeVisible()
  await expect(firstControls.getByRole('button', { name: 'Play audio' })).toBeVisible()
  await expect(firstControls.getByRole('slider', { name: 'Seek audio' })).toBeVisible()

  await reel.evaluate((element) => {
    element.scrollTop = element.clientHeight
  })
  await expect(reel).toHaveAttribute('data-active-post-id', 'uncovered-audio')
  const secondAudio = reel.locator('[data-post-id="uncovered-audio"] audio')
  await secondAudio.dispatchEvent('loadedmetadata')
  await expect(reel.locator('[data-post-id="uncovered-audio"] .media-audio-fallback'))
    .toBeVisible()
  await expect(controlsHost.locator('[data-control-post-id="uncovered-audio"]')).toBeVisible()
  await expect(firstControls).toHaveCount(0)
})

test('audio controls stay stationary in a desktop reel', async ({ page }) => {
  await page.setViewportSize({ height: 900, width: 1440 })
  await page.goto('/demos/audio-media?layout=reel')

  const reel = page.locator('.reel-feed')
  const activeAudio = reel.locator('[data-post-id="covered-audio"] audio')
  const controlsHost = page.locator('[data-test="reel-media-controls-host"]')
  await expect(activeAudio).toBeAttached()
  await activeAudio.dispatchEvent('loadedmetadata')
  const controls = controlsHost.getByRole('group', { name: 'Audio controls' })
  await expect(controls).toBeVisible()
  await expect(controls).toHaveAttribute('data-control-post-id', 'covered-audio')
  await expect(reel.locator('.media-controls')).toHaveCount(0)

  const samples = await reel.evaluate(async (element) => {
    const host = document.querySelector<HTMLElement>('[data-test="reel-media-controls-host"]')!
    const tops = [host.getBoundingClientRect().top]
    element.scrollTop = element.clientHeight * 0.35
    await new Promise((resolve) => setTimeout(resolve, 250))
    tops.push(host.getBoundingClientRect().top)
    return tops
  })
  expect(Math.max(...samples) - Math.min(...samples)).toBeLessThanOrEqual(1)
})
