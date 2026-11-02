import { expect, test, type Page } from '@playwright/test'

const noVisuals = process.env.VIBE_TEST_NO_VISUALS === '1'
const evidence = process.env.VIBE_SITE_REVIEW_DIR ?? 'test-results'
async function capture(page: Page, name: string) {
  if (!noVisuals) await page.screenshot({ path: `${evidence}/${name}.png` })
}

async function ready(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto('/')
  await expect.poll(async () => Number(await page.locator('[data-test=loaded-count]').textContent())).toBeGreaterThanOrEqual(18)
  await page.evaluate(() => document.fonts.ready)
  await expect(page.locator('.masonry-item img').first()).toBeVisible()
  await expect(page.locator('.masonry-item img').first()).toHaveJSProperty('complete', true)
  await expect(page.locator('.masonry-item img').first()).not.toHaveJSProperty('naturalWidth', 0)
  return errors
}

async function settledMedia(page: Page) {
  await expect(page.locator('.masonry-item video').first()).toHaveClass(/media-preview--ready/)
  await expect(page.locator('.masonry')).toHaveCSS('opacity', '1')
  await expect(page.locator('.masonry-item img').first()).toHaveCSS('opacity', '1')
  // Capture the existing library transitions after they complete, rather than
  // sampling the intentional loading/entry opacity halfway through a frame.
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    await Promise.all(document.getAnimations().filter((animation) => animation instanceof CSSTransition)
      .map((animation) => animation.finished.catch(() => {})))
  })
}

for (const width of [1440, 390]) {
  test(`initial masonry page presents mixed media without alternate demo controls at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    const errors = await ready(page)
    await expect(page.locator('[data-test=loaded-count]')).toHaveText('18')
    await expect(page.locator('[data-test=showcase-stage]')).toHaveAttribute('data-layout', 'masonry')
    await expect(page.locator('.masonry-item img').first()).toBeVisible()
    await expect(page.locator('.masonry-item video').first()).toBeVisible()
    await expect(page.locator('.masonry-item .media-audio-cover').first()).toBeAttached()
    await expect(page.locator('.masonry-item .showcase-card-stack').first()).toBeAttached()
    await expect(page.locator('[data-test=auto-scroll], [data-test=layout-reel], [data-test=layout-masonry]')).toHaveCount(0)
    await expect(page.getByText(/Original fixtures repeat|simulated page latency/i)).toHaveCount(0)
    expect(errors).toEqual([])
  })

  test(`card About closes back to its masonry source with Escape at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    const errors = await ready(page)
    const source = page.locator('.masonry-item').first()
    const postId = await source.getAttribute('data-post-id')
    await source.locator('.showcase-card-info').evaluate((button) => {
      button.addEventListener('pointerdown', () => {
        // Record the actual opening position after automation brings the
        // action into view, preserving real scroll restoration coverage.
        document.body.dataset.testOpeningScroll = String(
          button.closest('.vibe-surface')!.querySelector('.masonry-feed')!.scrollTop,
        )
      }, { once: true })
    })
    await source.locator('.showcase-card-info').click()
    await expect(page.locator('body')).toHaveAttribute('data-test-opening-scroll', /^\d+$/)
    const originalScroll = Number(await page.locator('body').getAttribute('data-test-opening-scroll'))
    await expect(page.locator('[data-test=media-information]')).toBeVisible()
    await expect(page.locator('.vibe-reel-overlay')).toBeVisible()
    await page.getByRole('button', { name: 'Close information', exact: true }).click()
    await expect(page.locator('[data-test=media-information]')).toBeHidden()
    await page.keyboard.press('Escape')
    await expect(page.locator('.masonry-feed')).toBeVisible()
    await expect(page.locator('.vibe-reel-overlay')).toHaveCount(0)
    await expect(page.locator('[data-test=showcase-stage]')).toHaveAttribute('data-layout', 'masonry')
    await expect(page.locator('[data-test=filter-all]')).toHaveAttribute('aria-pressed', 'true')
    expect(await page.locator('.masonry-feed').evaluate((element) => element.scrollTop)).toBe(originalScroll)
    await expect.poll(() => page.locator(`.masonry-item[data-post-id="${postId}"]`).evaluate((element) => (
      element.contains(document.activeElement)
    ))).toBe(true)
    expect(errors).toEqual([])
  })
}

test('a tall viewport fills automatically after opening, filtering, and restarting', async ({ page }) => {
  await page.setViewportSize({ width: 1889, height: 2045 })
  const errors = await ready(page)
  const feed = page.locator('.masonry-feed')
  async function expectScrollable() {
    await expect(page.locator('[data-test=showcase-stage]')).toHaveAttribute('data-loading', 'false')
    await expect.poll(() => feed.evaluate((element) => (
      element.scrollHeight > element.clientHeight
    ))).toBe(true)
    await expect(page.locator('[data-test=showcase-stage]')).toHaveAttribute('data-loading', 'false')
  }
  // Initial pages shorter than this viewport must request their next page
  // without a wheel event, a scrollbar, or a manual Load more action.
  await expectScrollable()
  expect(Number(await page.locator('[data-test=loaded-count]').textContent())).toBeGreaterThan(18)
  await capture(page, 'showcase-tall')
  await page.locator('[data-test=filter-image]').click()
  await expect(page.locator('[data-test=filter-image]')).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.masonry-item').first()).toHaveAttribute('data-post-id', /-image-0$/)
  await expectScrollable()
  await page.getByRole('button', { name: 'Restart demo', exact: true }).click()
  await expectScrollable()
  await expect(page.locator('.masonry-item').first()).toHaveAttribute('data-post-id', /-image-0$/)
  expect(errors).toEqual([])
})

test('infinite feed loads gracefully and bounds mounted cards as it grows', async ({ page }) => {
  const errors = await ready(page)
  const feed = page.locator('.masonry-feed')
  const loaded = page.locator('[data-test=loaded-count]')
  const initial = Number(await loaded.textContent())
  await feed.evaluate((element) => { element.scrollTop = element.scrollHeight })
  expect(await page.locator('.masonry-item').count()).toBeGreaterThan(0)
  await expect(loaded).toHaveText(String(initial + 18))
  for (let index = 0; index < 23; index++) {
    const before = Number(await loaded.textContent())
    await feed.evaluate((element) => { element.scrollTop = element.scrollHeight })
    await expect(loaded).not.toHaveText(String(before))
  }
  const count = Number(await loaded.textContent())
  const mounted = await page.locator('.masonry-item').count()
  expect(count).toBeGreaterThanOrEqual(300)
  expect(mounted).toBeLessThan(60)
  expect(mounted).toBeLessThan(count / 3)
  await expect(page.locator('[data-test=rendered-count]')).toHaveText(String(mounted))
  console.log(JSON.stringify({ showcaseLoaded: count, mountedCards: mounted }))
  await page.getByRole('button', { name: 'Restart demo', exact: true }).click()
  await expect(loaded).not.toHaveText(String(count))
  await expect(page.locator('.masonry-item').first()).toHaveAttribute('data-post-id', /-all-0$/)
  await settledMedia(page)
  await capture(page, 'showcase-desktop')
  expect(errors).toEqual([])
})

test('filters and information work without direct reel or automatic-scroll controls', async ({ page }) => {
  const errors = await ready(page)
  await settledMedia(page)
  await expect(page.locator('[data-test=auto-scroll], [data-test=layout-reel], [data-test=layout-masonry]')).toHaveCount(0)
  await expect(page.getByText(/Original fixtures repeat|simulated page latency/i)).toHaveCount(0)
  await expect(page.locator('[data-test=showcase-stage]')).toHaveAttribute('data-layout', 'masonry')
  await page.locator('[data-test=filter-video]').click()
  await expect(page.locator('.masonry-item video').first()).toBeVisible()
  await page.locator('[data-test=filter-audio]').click()
  await expect(page.locator('.masonry-item').first()).toContainText('Quiet frequency')
  await page.locator('[data-test=filter-image]').click()
  await expect(page.locator('.masonry-item img').first()).toBeVisible()
  await page.locator('.showcase-card-info').first().click()
  await expect(page.locator('[data-test=media-information]')).toBeVisible()
  await expect(page.locator('[data-test=media-information]')).toContainText('AI-generated image')
  await page.getByRole('button', { name: 'Close information', exact: true }).click()
  await expect(page.locator('[data-test=media-information]')).toBeHidden()
  await page.keyboard.press('Escape')
  await expect(page.locator('.masonry-feed')).toBeVisible()
  await expect(page.locator('[data-test=filter-image]')).toHaveAttribute('aria-pressed', 'true')
  expect(errors).toEqual([])
})

test('phone and tablet layouts stay usable with reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const errors = await ready(page)
  await settledMedia(page)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  for (const selector of ['[data-test=filter-all]', '[data-test=reset-demo]', '.showcase-card-info']) {
    const box = await page.locator(selector).first().boundingBox()
    expect(box!.height).toBeGreaterThanOrEqual(44)
    expect(box!.width).toBeGreaterThanOrEqual(44)
  }
  await capture(page, 'showcase-phone')
  await page.locator('[data-test=filter-video]').click()
  await page.locator('[data-test=filter-image]').click()
  await expect(page.locator('.masonry-item img').first()).toBeVisible()
  await page.setViewportSize({ width: 820, height: 1180 })
  await page.locator('[data-test=filter-all]').click()
  await expect(page.locator('[data-test=request-state]')).toHaveText('Ready to explore')
  await settledMedia(page)
  await expect(page.locator('.masonry-item').first()).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await capture(page, 'showcase-tablet')
  expect(errors).toEqual([])
})

test('desktop review capture uses settled feed opacity', async ({ page }) => {
  const errors = await ready(page)
  await settledMedia(page)
  await expect(page.locator('.brand-mark')).toHaveAttribute('src', /logo\.svg$/)
  await expect(page.locator('.showcase-intro, .integration-strip, .site-footer')).toHaveCount(0)
  const feed = await page.locator('[data-test=showcase-stage]').boundingBox()
  expect(feed!.height).toBeGreaterThan(960 * 0.8)
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight)).toBe(true)
  await capture(page, 'showcase-desktop')
  expect(errors).toEqual([])
})

test('all fixture sources are local and generation provenance is complete', async ({ request }) => {
  const response = await request.get('/media/provenance.json')
  expect(response.ok()).toBe(true)
  const manifest = await response.json()
  expect(manifest.thirdPartyMediaUsed).toBe(false)
  expect(manifest.assets.filter((item: { file: string }) => /image-0[1-4]\.png/.test(item.file))).toHaveLength(4)
  for (const asset of manifest.assets) {
    expect((await request.get(`/media/${asset.file}`)).ok()).toBe(true)
  }
  expect(manifest.deliveryDerivatives.reduce((bytes: number, item: { bytes: number }) => bytes + item.bytes, 0)).toBeLessThan(1000000)
})
