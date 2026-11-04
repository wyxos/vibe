import { createHash } from 'node:crypto'
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

for (const width of [1440, 768, 390]) {
  test(`toggles native reel previews at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    const errors = await ready(page)
    await page.locator('.masonry-item .media-card-activator').first().click()
    await expect(page.locator('.vibe-reel-overlay')).toHaveAttribute('data-reel-entry', 'ready')
    const toggle = page.getByRole('button', { name: 'Upcoming previews', exact: true })
    const rail = page.getByRole('complementary', { name: 'Upcoming reel items' })
    const cards = rail.locator('[data-preview-post-id]')
    const feed = page.locator('.reel-feed')
    const post = await feed.getAttribute('data-active-post-id')
    await expect(toggle).toHaveAttribute('aria-pressed', 'false')
    await expect(rail).toHaveCount(0)
    const closedWidth = (await feed.boundingBox())!.width
    const sampleWidths = () => feed.evaluate(element => new Promise<number[]>((resolve) => {
      const viewport = element.parentElement!
      const widths: number[] = []
      const observer = new ResizeObserver(() => widths.push(element.getBoundingClientRect().width))
      observer.observe(element)
      viewport.addEventListener('transitionend', function finish(event) {
        if (event.target !== viewport || event.propertyName !== 'grid-template-columns') return
        viewport.removeEventListener('transitionend', finish)
        observer.disconnect()
        resolve(widths)
      })
    }))
    const openingWidths = sampleWidths()
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await expect(cards).toHaveCount(4)
    const widths = await openingWidths
    const { railBox, feedBox, controlsBox } = await feed.evaluate(element => {
      const viewport = element.parentElement!
      const box = (target: Element) => target.getBoundingClientRect().toJSON() as DOMRect
      return { railBox: box(viewport.querySelector('.reel-previews')!), feedBox: box(element),
        controlsBox: box(viewport.querySelector('.reel-media-controls-host')!) }
    })
    expect(widths.some(value => value > feedBox.width + 2 && value < closedWidth - 2)).toBe(true)
    expect(feedBox.x + feedBox.width).toBeLessThanOrEqual(railBox.x + 1)
    expect(controlsBox.x + controlsBox.width).toBeLessThanOrEqual(railBox.x + 1)
    expect(railBox.x + railBox.width).toBeLessThanOrEqual(width)
    await page.getByRole('button', { name: 'More previews' }).click()
    await expect(cards).toHaveCount(5)
    await capture(page, `native-reel-previews-${width}`)
    const closingWidths = sampleWidths()
    await toggle.click()
    await expect(rail).toHaveCount(0)
    expect((await closingWidths).some(value => value > feedBox.width + 2 && value < closedWidth - 2)).toBe(true)
    await expect(feed).toHaveAttribute('data-active-post-id', post!)
    expect((await feed.boundingBox())!.width).toBeGreaterThan(feedBox.width)
    expect(errors).toEqual([])
  })
}

for (const reduced of [false, true]) {
  test(`positions and moves upcoming previews with reduced motion ${reduced}`, async ({ page }) => {
    const width = reduced ? 390 : 1440
    await page.setViewportSize({ width, height: 844 })
    await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' })
    const errors = await ready(page)
    await page.locator('.masonry-item .media-card-activator').first().click()
    await expect(page.locator('.vibe-reel-overlay')).toHaveAttribute('data-reel-entry', 'ready')
    await page.getByRole('button', { name: 'Upcoming previews' }).click()
    const rail = page.locator('.reel-previews')
    const feed = page.locator('.reel-feed')
    for (const position of ['right', 'left', 'top', 'bottom']) {
      await page.getByRole('group', { name: 'Preview placement' }).getByRole('button', { name: position }).click()
      await expect.poll(async () => {
        const preview = (await rail.boundingBox())!
        const item = (await feed.boundingBox())!
        if (position === 'right') return Math.abs(preview.x - item.x - item.width)
        if (position === 'left') return Math.abs(item.x - preview.x - preview.width)
        if (position === 'top') return Math.abs(item.y - preview.y - preview.height)
        return Math.abs(preview.y - item.y - item.height)
      }).toBeLessThanOrEqual(1)
      await expect(rail.locator('[data-preview-post-id]')).toHaveCount(4)
      for (const clipped of [rail, rail.locator('.reel-preview-viewport')]) {
        await expect(clipped).toHaveCSS('overflow', 'clip')
      }
      await capture(page, `vibe-carousel-${position}-${width}`)
      const observed = await feed.evaluate(async (element, horizontal) => {
        const list = element.parentElement!.querySelector('.reel-preview-list')!
        const retained = list.children[1]!
        const initial = element.getAttribute('data-active-post-id')
        const coordinate = () => retained.getBoundingClientRect()[horizontal ? 'x' : 'y']
        const sample = async (scrollTop: number) => {
          const start = coordinate()
          const frames: number[] = []
          element.scrollTop = scrollTop
          for (let frame = 0; frame < 45; frame++) {
            await new Promise(requestAnimationFrame)
            frames.push(coordinate())
          }
          const end = frames.at(-1)!
          const direction = Math.sign(end - start)
          return { direction, steps: new Set(frames.filter(value => Math.abs(value - start) > 1 && Math.abs(value - end) > 1).map(Math.round)).size,
            reversed: frames.some((value, index) => index && (value - frames[index - 1]!) * direction < -1) }
        }
        const forward = await sample(element.clientHeight)
        const changed = element.getAttribute('data-active-post-id') !== initial
        const backward = await sample(0)
        return { changed, forward, backward, restored: element.getAttribute('data-active-post-id') === initial }
      }, position === 'top' || position === 'bottom')
      expect(observed).toMatchObject({ changed: true, forward: { direction: -1, reversed: false },
        backward: { direction: 1, reversed: false }, restored: true })
      for (const sample of [observed.forward, observed.backward]) {
        if (reduced) expect(sample.steps).toBe(0)
        else expect(sample.steps).toBeGreaterThan(3)
      }
    }
    if (reduced) {
      const more = page.getByRole('button', { name: 'More previews' })
      for (let count = 4; count < 12; count++) await more.click()
      const cards = rail.locator('[data-preview-post-id]')
      await expect(cards).toHaveCount(12)
      const viewport = rail.locator('.reel-preview-viewport')
      await expect(viewport).toHaveCSS('overflow', 'clip')
      const edge = (await viewport.boundingBox())!
      const last = (await cards.last().boundingBox())!
      expect(last.x + last.width).toBeLessThanOrEqual(edge.x + edge.width + 1)
    }
    expect(errors).toEqual([])
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
    await expect(page.getByRole('navigation', { name: 'Demo version', exact: true })).toHaveCount(0)
    await expect(page.locator('iframe')).toHaveCount(0)
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

for (const width of [1440, 390]) for (const reducedMotion of [false, true]) {
  test(`Back to feed closes the viewer at ${width}px with reduced motion ${reducedMotion}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await page.emulateMedia({ reducedMotion: reducedMotion ? 'reduce' : 'no-preference' })
    const errors = await ready(page)
    const source = page.locator('.masonry-item').first()
    await source.locator('.media-card-activator').click()
    const originalScroll = await page.locator('.masonry-feed').evaluate(element => element.scrollTop)
    const back = page.getByRole('button', { name: 'Back to feed', exact: true })
    await expect(back).toBeVisible()
    await expect(page.locator('.vibe-reel-overlay')).toHaveAttribute('data-reel-entry', 'ready')
    expect(await back.evaluate(button => button.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    if (!reducedMotion) await capture(page, `back-to-feed-${width}`)
    await back.focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('.vibe-reel-overlay')).toHaveCount(0)
    await expect(page.locator('[data-test=showcase-stage]')).toHaveAttribute('data-layout', 'masonry')
    await expect(source.locator('.media-card-activator')).toBeFocused()
    expect(await page.locator('.masonry-feed').evaluate(element => element.scrollTop)).toBe(originalScroll)
    await expect(back).toHaveCount(0)
    expect(errors).toEqual([])
  })
}

for (const width of [1440, 390]) test(`bottom previews stay clear of sliding video controls at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 844 })
  const errors = await ready(page)
  await page.getByRole('button', { name: 'Motion', exact: true }).click()
  await page.getByRole('button', { name: 'Open post showcase-orbit-video-0', exact: true }).click()
  await expect(page.locator('.vibe-reel-overlay')).toHaveAttribute('data-reel-entry', 'ready')
  await page.getByRole('button', { name: 'bottom', exact: true }).click()
  await page.getByRole('button', { name: 'Upcoming previews', exact: true }).click()
  const rail = page.locator('.reel-previews')
  const host = page.locator('.reel-media-controls-host')
  const controls = host.locator('.media-controls--reel')
  await expect(rail.locator('[data-preview-post-id]').first()).toBeVisible()
  await expect(host).toHaveCSS('clip-path', /inset\(/)
  await expect(controls.getByRole('button', { name: 'Pause video', exact: true })).toBeVisible()
  const feed = await page.locator('.reel-feed').boundingBox()
  await page.mouse.move(feed!.x + feed!.width / 2, feed!.y + feed!.height / 2)
  await expect(controls).not.toHaveClass(/idle-hidden/)
  const frames = controls.evaluate(async element => {
    const host = element.parentElement!
    const rail = host.parentElement!.querySelector('.reel-previews')!
    const samples: number[] = []
    while (getComputedStyle(element).visibility !== 'hidden') {
      await new Promise(requestAnimationFrame)
      const y = element.getBoundingClientRect().y - host.getBoundingClientRect().y
      if (y > 0.5 && getComputedStyle(element).visibility === 'visible') samples.push(y)
    }
    return { samples, gap: Math.abs(host.getBoundingClientRect().bottom - rail.getBoundingClientRect().top) }
  })
  await expect(controls).toHaveClass(/idle-hidden/, { timeout: 8000 })
  await expect(controls).toHaveCSS('visibility', 'hidden')
  const slide = await frames
  expect(slide.samples.length).toBeGreaterThan(2)
  expect(slide.gap).toBeLessThanOrEqual(1)
  await page.mouse.move(feed!.x + feed!.width / 2 + 10, feed!.y + feed!.height / 2)
  await expect(controls).toHaveCSS('visibility', 'visible')
  await controls.getByRole('button', { name: 'Pause video', exact: true }).click()
  await expect(controls.getByRole('button', { name: 'Play video', exact: true })).toBeVisible()
  await capture(page, `vibe-bottom-controls-${width}`)
  await page.getByRole('button', { name: 'Video options', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Enter fullscreen', exact: true })).toBeVisible()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect.poll(() => controls.evaluate(element => Number.parseFloat(getComputedStyle(element).transitionDuration))).toBeLessThan(0.001)
  expect(errors).toEqual([])
})

test('fullscreen hides the showcase toolbar and restores it on exit', async ({ page }) => {
  await ready(page)
  await page.locator('[data-test=filter-video]').click()
  const source = page.getByRole('button', { name: 'Open post showcase-orbit-video-0', exact: true })
  await expect(source).toBeVisible()
  await expect(page.locator('[data-test=showcase-stage]')).toHaveAttribute('data-loading', 'false')
  await source.click()
  const back = page.getByRole('button', { name: 'Back to feed', exact: true })
  const previews = page.getByRole('button', { name: 'Upcoming previews', exact: true })
  const cog = page.getByRole('button', { name: 'Video options', exact: true })
  await expect(back).toBeVisible()
  await expect(previews).toBeVisible()
  await cog.click()
  await page.getByRole('button', { name: 'Enter fullscreen', exact: true }).click()
  await expect(back).toBeHidden()
  await expect(previews).toBeHidden()
  await expect(page.locator('.reel-shell > .media-card-footer')).toBeVisible()
  await cog.click()
  await page.getByRole('button', { name: 'Exit fullscreen', exact: true }).click()
  await expect(back).toBeVisible()
  await expect(previews).toBeVisible()
})

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


test('licensed catalogue has distinct files, complete credits and intact delivery assets', async ({ request }) => {
  const response = await request.get('/media/catalogue.json')
  expect(response.ok()).toBe(true)
  const catalogue = await response.json()
  expect(catalogue.thirdPartyMediaUsed).toBe(true)
  expect(catalogue.assets).toHaveLength(90)
  expect(new Set(catalogue.assets.map((asset: { sourceMediaUrl: string }) => asset.sourceMediaUrl)).size).toBe(90)
  for (const asset of catalogue.assets) {
    expect(asset.credit.author).toBeTruthy()
    expect(asset.credit.originalTitle).toBeTruthy()
    expect(asset.credit.sourceUrl).toMatch(/^https:\/\/commons\.wikimedia\.org\//)
    expect(asset.credit.licenseUrl).toMatch(/^https:\/\/creativecommons\.org\//)
    expect(asset.credit.changes).toBeTruthy()
    for (const delivery of [asset, ...(asset.cover ? [asset.cover] : [])]) {
      const file = await request.get(`/media/${delivery.file}`)
      expect(file.ok()).toBe(true)
      expect(createHash('sha256').update(await file.body()).digest('hex')).toBe(delivery.sha256)
    }
  }
})

test('each category offers at least eighteen distinct media sources before repeating', async ({ page }) => {
  await ready(page)
  const catalogues = await page.evaluate(async () => {
    const path = '/fixtures.ts'
    const { getShowcaseItems } = await import(/* @vite-ignore */ path)
    return ['all', 'image', 'video', 'audio'].map((kind) => {
      const items = getShowcaseItems(kind) as { src: string }[]
      return { kind, count: items.length, firstSources: items.slice(0, 18).map((item) => item.src) }
    })
  })
  expect(catalogues.map((catalogue) => catalogue.count)).toEqual([108, 62, 26, 20])
  for (const catalogue of catalogues) expect(new Set(catalogue.firstSources).size).toBe(18)
})


for (const width of [1440, 390]) test(`licensed media exposes its credit and license at ${width}px`, async ({ page, request }) => {
  await page.setViewportSize({ width, height: 844 })
  const errors = await ready(page)
  const catalogue = await (await request.get('/media/catalogue.json')).json()
  const source = page.locator('.masonry-item[data-post-id^="commons-image-01-"]')
  await source.locator('.showcase-card-info').click()
  const sheet = page.locator('[data-test=media-information]')
  await expect(sheet).toBeVisible()
  await expect(sheet).toContainText(catalogue.assets[0].credit.author)
  await expect(sheet.getByRole('link', { name: catalogue.assets[0].credit.license, exact: true })).toHaveAttribute('href', catalogue.assets[0].credit.licenseUrl)
  await expect(sheet.getByRole('link', { name: 'Wikimedia Commons', exact: true })).toHaveAttribute('href', catalogue.assets[0].credit.sourceUrl)
  await expect(sheet).toContainText('Licensed media')
  await expect(page.locator('.vibe-reel-overlay')).toHaveAttribute('data-reel-entry', 'ready')
  await page.evaluate(async () => {
    await Promise.all(document.getAnimations().filter((animation) => animation instanceof CSSTransition)
      .map((animation) => animation.finished.catch(() => {})))
  })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await capture(page, `licensed-info-${width}`)
  expect(errors).toEqual([])
})
