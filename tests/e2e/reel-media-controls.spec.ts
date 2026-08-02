import { expect, test } from '@playwright/test'

interface FixtureItem {
  url: string
  [key: string]: unknown
}

interface FixturePage {
  items: FixtureItem[]
  metadata: Record<string, unknown>
}

test('timed-media controls stay fixed to the reel viewport and fade between posts', async ({
  page,
}) => {
  await page.goto('/demos/reel-auto-advance')
  const reel = page.locator('.reel-feed')
  const controlsHost = page.locator('[data-test="reel-media-controls-host"]')
  await expect(reel).toBeVisible()
  await expect(controlsHost).toBeAttached()
  await expect.poll(() => reel.evaluate((element) => (
    element.scrollHeight > element.clientHeight * 1.5
  ))).toBe(true)

  const firstPostId = await reel.getAttribute('data-active-post-id')
  await reel.evaluate((element) => {
    element.scrollTop = element.clientHeight
  })
  await expect.poll(() => reel.getAttribute('data-active-post-id')).not.toBe(firstPostId)
  const timedPostId = await reel.getAttribute('data-active-post-id')
  const controls = controlsHost.locator('.media-controls')
  await expect(controls).toBeVisible()
  await expect(controls).not.toHaveClass(/vibe-reel-media-controls-enter-active/)
  await expect(controls).toHaveAttribute('data-control-post-id', timedPostId!)
  await expect(reel.locator('.media-controls')).toHaveCount(0)

  const stationarySamplesPromise = page.evaluate(() => new Promise<{
    cardTop: number[]
    controlsTop: number[]
  }>((resolve) => {
    const element = document.querySelector<HTMLElement>('.reel-feed')!
    const host = document.querySelector<HTMLElement>('[data-test="reel-media-controls-host"]')!
    const activeCard = element.querySelector<HTMLElement>(
      `[data-post-id="${element.dataset.activePostId}"]`,
    )!
    const controlsTop: number[] = []
    const cardTop: number[] = []
    const record = () => {
      controlsTop.push(host.getBoundingClientRect().top)
      cardTop.push(activeCard.getBoundingClientRect().top)
    }
    record()
    element.addEventListener('scroll', record, { passive: true })
    setTimeout(() => {
      element.removeEventListener('scroll', record)
      resolve({ cardTop, controlsTop })
    }, 700)
  }))
  await reel.hover()
  await page.mouse.wheel(0, 300)
  const stationarySamples = await stationarySamplesPromise

  expect(stationarySamples.cardTop.length).toBeGreaterThan(1)
  expect(Math.max(...stationarySamples.controlsTop) - Math.min(...stationarySamples.controlsTop))
    .toBeLessThanOrEqual(1)
  expect(Math.max(...stationarySamples.cardTop) - Math.min(...stationarySamples.cardTop))
    .toBeGreaterThan(20)

  await reel.evaluate((element) => {
    element.scrollTop = element.clientHeight
  })
  await expect(reel).toHaveAttribute('data-active-post-id', timedPostId!)
  await expect(controlsHost.locator('.media-controls')).toBeVisible()

  const fadeSamples = await reel.evaluate(async (element) => {
    const host = document.querySelector<HTMLElement>('[data-test="reel-media-controls-host"]')!
    const samples: Array<{ className: string; opacity: number }> = []
    element.scrollTop = 0

    const startedAt = performance.now()
    while (performance.now() - startedAt < 260) {
      const controls = host.querySelector<HTMLElement>('.media-controls')
      if (controls) {
        samples.push({
          className: controls.className,
          opacity: Number.parseFloat(getComputedStyle(controls).opacity),
        })
      }
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    }
    return samples
  })
  await expect(reel).toHaveAttribute('data-active-post-id', firstPostId!)
  await expect(controlsHost.locator('.media-controls')).toHaveCount(0)
  expect(fadeSamples.some(({ className, opacity }) => (
    className.includes('vibe-reel-media-controls-leave-active') || opacity < 1
  ))).toBe(true)

  await reel.evaluate((element) => {
    element.scrollTop = element.clientHeight
  })
  await expect(reel).toHaveAttribute('data-active-post-id', timedPostId!)
  await expect(controlsHost.locator('.media-controls')).toBeVisible()
})

test('timed-media controls remain contained at the bottom of the phone reel', async ({
  page,
}) => {
  await page.setViewportSize({ height: 844, width: 390 })
  await page.goto('/demos/reel-auto-advance')
  const reel = page.locator('.reel-feed')
  const controlsHost = page.locator('[data-test="reel-media-controls-host"]')
  await expect(reel).toBeVisible()
  await expect.poll(() => reel.evaluate((element) => (
    element.scrollHeight > element.clientHeight * 1.5
  ))).toBe(true)

  const firstPostId = await reel.getAttribute('data-active-post-id')
  await reel.evaluate((element) => {
    element.scrollTop = element.clientHeight
  })
  await expect.poll(() => reel.getAttribute('data-active-post-id')).not.toBe(firstPostId)
  const controls = controlsHost.locator('.media-controls')
  await expect(controls).toBeVisible()
  await expect(controls).not.toHaveClass(/vibe-reel-media-controls-enter-active/)

  const reelBox = await reel.boundingBox()
  const hostBox = await controlsHost.boundingBox()
  const controlsBox = await controls.boundingBox()
  expect(reelBox).not.toBeNull()
  expect(hostBox).not.toBeNull()
  expect(controlsBox).not.toBeNull()
  expect(Math.abs(controlsBox!.x - reelBox!.x)).toBeLessThanOrEqual(1)
  expect(Math.abs((controlsBox!.x + controlsBox!.width) - (reelBox!.x + reelBox!.width)))
    .toBeLessThanOrEqual(1)
  expect(Math.abs((controlsBox!.y + controlsBox!.height) - (reelBox!.y + reelBox!.height)))
    .toBeLessThanOrEqual(1)
  for (const control of await controls.locator('button, input').all()) {
    const controlBox = await control.boundingBox()
    expect(controlBox).not.toBeNull()
    expect(controlBox!.y + controlBox!.height).toBeLessThanOrEqual(reelBox!.y + reelBox!.height)
  }

  await reel.evaluate((element) => {
    element.scrollTop = 0
  })
  await expect(reel).toHaveAttribute('data-active-post-id', firstPostId!)
  await expect(controls).toHaveCount(0)
})

test('timed-media controls clear the snapped footer and leave Load more clickable', async ({
  page,
}) => {
  await page.route('**/data/civitai/images/page-01.json', async (route) => {
    const response = await route.fetch()
    const fixture = await response.json() as FixturePage
    const timedItem = fixture.items.find(({ url }) => /\.mp4(?:\?|$)/.test(url))
    if (!timedItem) throw new Error('Expected page-one timed-media fixture')

    await route.fulfill({
      response,
      json: { ...fixture, items: [timedItem] },
    })
  })
  await page.goto('/demos/reel-auto-advance')

  const reel = page.locator('.reel-feed')
  const controlsHost = page.locator('[data-test="reel-media-controls-host"]')
  await expect(controlsHost.locator('.media-controls')).toBeVisible()
  const infiniteScroll = page.getByRole('checkbox', { name: 'Infinite scroll' })
  await page.getByText('Infinite scroll', { exact: true }).click()
  await expect(infiniteScroll).not.toBeChecked()
  const loadMore = reel.getByRole('button', { name: 'Load more' })
  await expect(loadMore).toBeVisible()

  await reel.evaluate((element) => {
    element.scrollTop = element.scrollHeight
  })
  await expect(controlsHost.locator('.media-controls')).toHaveCount(0)
  await expect(loadMore).toBeVisible()

  const reelBox = await reel.boundingBox()
  const loadMoreBox = await loadMore.boundingBox()
  expect(reelBox).not.toBeNull()
  expect(loadMoreBox).not.toBeNull()
  expect(loadMoreBox!.y + loadMoreBox!.height).toBeLessThanOrEqual(reelBox!.y + reelBox!.height)

  await loadMore.click()
  await expect(reel.locator('.load-more-status')).toContainText('Loading more')
})
