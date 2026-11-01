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
  await expect.poll(async () => Number(await page.locator('[data-test=loaded-count]').textContent())).toBeGreaterThanOrEqual(12)
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

test('infinite feed loads gracefully and bounds mounted cards as it grows', async ({ page }) => {
  const errors = await ready(page)
  const feed = page.locator('.masonry-feed')
  const loaded = page.locator('[data-test=loaded-count]')
  const initial = Number(await loaded.textContent())
  await feed.evaluate((element) => { element.scrollTop = element.scrollHeight })
  await expect(page.locator('[data-test=request-state]')).toContainText('next page')
  expect(await page.locator('.masonry-item').count()).toBeGreaterThan(0)
  await expect(loaded).toHaveText(String(initial + 12))
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

test('filters, information sheet, reel and automatic scrolling work', async ({ page }) => {
  const errors = await ready(page)
  await settledMedia(page)
  await page.locator('[data-test=auto-scroll]').click()
  await expect(page.locator('[data-test=auto-scroll]')).toHaveAttribute('aria-pressed', 'true')
  await page.locator('[data-test=auto-scroll]').click()
  await page.locator('[data-test=filter-video]').click()
  await expect(page.locator('.masonry-item video').first()).toBeVisible()
  await page.locator('[data-test=filter-audio]').click()
  await expect(page.locator('.masonry-item').first()).toContainText('Quiet frequency')
  await page.locator('[data-test=layout-reel]').click()
  await expect(page.locator('.reel-shell audio').first()).toBeAttached()
  await page.locator('[data-test=layout-masonry]').click()
  await page.locator('[data-test=filter-image]').click()
  await expect(page.locator('.masonry-item img').first()).toBeVisible()
  await page.locator('.showcase-card-info').first().click()
  await expect(page.locator('[data-test=media-information]')).toBeVisible()
  await expect(page.locator('[data-test=media-information]')).toContainText('AI-generated image')
  await page.getByRole('button', { name: 'Close information', exact: true }).click()
  await expect(page.locator('[data-test=media-information]')).toBeHidden()
  await page.locator('[data-test=layout-masonry]').click()
  await expect(page.locator('.masonry-feed')).toBeVisible()
  await page.locator('[data-test=layout-reel]').click()
  await expect(page.locator('.reel-feed')).toBeVisible()
  expect(errors).toEqual([])
})

test('phone and tablet layouts stay usable with reduced motion', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const errors = await ready(page)
  await settledMedia(page)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  for (const selector of ['[data-test=filter-all]', '[data-test=auto-scroll]', '.showcase-card-info']) {
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
