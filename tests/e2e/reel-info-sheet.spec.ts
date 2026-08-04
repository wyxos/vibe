import { expect, test, type Page } from '@playwright/test'

async function waitForDemo(page: Page): Promise<void> {
  await page.goto('/demos/reel-info-sheet')
  await expect(page.locator('.demo-vibe-host [data-post-id]').first()).toBeVisible()
}

async function openPhoneSheet(page: Page): Promise<void> {
  await waitForDemo(page)
  await page.evaluate(() => {
    const browserWindow = window as Window & { sheetTransitionDuration?: string }
    browserWindow.sheetTransitionDuration = undefined
    const observer = new MutationObserver(() => {
      const layer = document.querySelector('[data-test="reel-info-sheet"]')
      if (!layer) return

      browserWindow.sheetTransitionDuration = getComputedStyle(layer).transitionDuration
      observer.disconnect()
    })
    observer.observe(document.body, { childList: true, subtree: true })
  })
  const toggle = page.getByRole('button', { name: 'Open reel information sheet' })
  await expect(toggle).toBeEnabled()
  await toggle.click()
  await expect(page.getByRole('dialog', { name: 'Reel information' })).toBeVisible()
}

async function openMasonrySheet(page: Page): Promise<void> {
  await waitForDemo(page)
  await page.locator('.demo-vibe-host .masonry-item').first().click()
  await expect(page.locator('.vibe-reel-overlay')).toBeVisible()
  const toggle = page.getByRole('button', { name: 'Open reel information sheet' })
  await expect(toggle).toBeEnabled()
  await toggle.click()
  await expect(page.getByRole('complementary', { name: 'Reel information' })).toBeVisible()
}

async function expectPersistentAcrossPostChange(page: Page): Promise<void> {
  const sheet = page.locator('[data-test="reel-info-sheet"]')
  await expect(sheet).not.toHaveClass(/vibe-info-sheet-enter-active/)
  const reel = page.locator('.vibe-reel-overlay .reel-feed')
  const firstPostId = await reel.getAttribute('data-active-post-id')
  await sheet.evaluate((element) => { element.setAttribute('data-e2e-identity', 'stable') })
  expect(await page.evaluate(() => (
    window.__vibeReelInfoSheetDemo?.nextReelPost()
  ))).toBe(true)

  await expect.poll(() => reel.getAttribute('data-active-post-id')).not.toBe(firstPostId)
  await expect(sheet).toHaveAttribute('data-e2e-identity', 'stable')
  await expect.poll(async () => (
    await page.locator('.demo-reel-info-sheet').getAttribute('data-context-post-id')
    === await reel.getAttribute('data-active-post-id')
  )).toBe(true)
}

test('exact media removal keeps the reel and sheet active through restore and forward loading', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await openMasonrySheet(page)
  const reel = page.locator('.vibe-reel-overlay .reel-feed')
  const sheet = page.locator('[data-test="reel-info-sheet"]')
  const nonActive = await page.evaluate(() => {
    const vibe = window.__vibeReelInfoSheetDemo
    if (!vibe) return null
    const state = vibe.getState()
    const target = state.items.find((item) => item.postId !== state.activeReelPostId)
    return target
      ? {
          activePostId: String(state.activeReelPostId),
          count: target.items.length + 1,
          postId: target.postId,
        }
      : null
  })
  expect(nonActive).not.toBeNull()
  await expect(reel).toHaveAttribute('data-active-post-id', nonActive!.activePostId)
  const activePreview = reel.locator(
    `[data-post-id="${nonActive!.activePostId}"] img.media-preview`,
  ).first()
  const initialSource = await activePreview.getAttribute('src')

  expect(await page.evaluate(({ postId }) => {
    const vibe = window.__vibeReelInfoSheetDemo
    if (!vibe) return false
    const holder = vibe as typeof vibe & { __e2eRemoval?: unknown }
    holder.__e2eRemoval = vibe.removeMedia({
      mediaIndex: 0,
      postId,
    })
    return holder.__e2eRemoval !== null
  }, nonActive!)).toBe(true)

  await expect(sheet).toBeVisible()
  await expect(reel).toHaveAttribute('data-active-post-id', nonActive!.activePostId)
  await expect(reel).toHaveAttribute('data-active-media-index', '0')
  await expect(activePreview).toHaveAttribute('src', initialSource ?? '')

  expect(await page.evaluate(() => {
    const vibe = window.__vibeReelInfoSheetDemo
    if (!vibe) return false
    const holder = vibe as typeof vibe & { __e2eRemoval?: unknown }
    return holder.__e2eRemoval
      ? vibe.restoreMediaRemoval(holder.__e2eRemoval as never)
      : false
  })).toBe(true)
  await expect(activePreview).toHaveAttribute('src', initialSource ?? '')
  expect(await page.evaluate((postId) => {
    const vibe = window.__vibeReelInfoSheetDemo
    const item = vibe?.getState().items.find((candidate) => candidate.postId === postId)
    return item ? item.items.length + 1 : 0
  }, nonActive!.postId)).toBe(nonActive!.count)

  const remainingPostIds = await page.evaluate(() => {
    const vibe = window.__vibeReelInfoSheetDemo
    if (!vibe) return []
    const state = vibe.getState()
    const activeIndex = state.items.findIndex(
      (item) => item.postId === state.activeReelPostId,
    )
    return state.items.slice(activeIndex + 1).map((item) => String(item.postId))
  })
  for (const postId of remainingPostIds) {
    expect(await page.evaluate(() => (
      window.__vibeReelInfoSheetDemo?.nextReelPost()
    ))).toBe(true)
    await expect(reel).toHaveAttribute('data-active-post-id', postId)
  }
  const lastLoaded = await page.evaluate(() => {
    const vibe = window.__vibeReelInfoSheetDemo
    if (!vibe) return null
    const state = vibe.getState()
    const active = state.items.find((item) => item.postId === state.activeReelPostId)
    return active
      ? {
          count: active.items.length + 1,
          postId: active.postId,
          postIdText: String(active.postId),
        }
      : null
  })
  expect(lastLoaded).not.toBeNull()
  await expect(reel).toHaveAttribute('data-active-post-id', lastLoaded!.postIdText)

  expect(await page.evaluate(async ({ count, postId }) => {
    const vibe = window.__vibeReelInfoSheetDemo
    if (!vibe?.removeMediaAnimated) return false
    for (let index = 0; index < count; index += 1) {
      if (!await vibe.removeMediaAnimated({ mediaIndex: 0, postId })) return false
    }
    return true
  }, lastLoaded!)).toBe(true)

  await expect(page.locator('.reel-forward-status[data-status="loading"]')).toBeVisible()
  await expect(sheet).toBeVisible()
  await expect.poll(() => reel.getAttribute('data-active-post-id'), { timeout: 5_000 })
    .not.toBe(lastLoaded!.postIdText)
  await expect(page.locator('.reel-forward-status')).toBeHidden()
  await expect(sheet).toBeVisible()
})

test.describe('phone reel information sheet', () => {
  test.use({
    hasTouch: true,
    isMobile: true,
    screen: { width: 390, height: 844 },
    viewport: { width: 390, height: 844 },
  })

  test('uses an animated full-width modal overlay with two masonry tabs', async ({ page }) => {
    await openPhoneSheet(page)
    const layout = page.locator('.reel-layout')
    const layer = page.locator('[data-test="reel-info-sheet"]')
    const layoutBox = await layout.boundingBox()
    const layerBox = await layer.boundingBox()

    expect(layoutBox).not.toBeNull()
    expect(layerBox).not.toBeNull()
    expect(Math.abs((layerBox?.width ?? 0) - (layoutBox?.width ?? 0))).toBeLessThan(2)
    await expect(layout.locator('.reel-layout-main')).toHaveAttribute('inert', '')
    expect(await page.evaluate(() => (
      window as Window & { sheetTransitionDuration?: string }
    ).sheetTransitionDuration)).not.toBe('0s')

    await expect(page.getByRole('tab')).toHaveCount(2)
    await expect(page.getByRole('tab', { name: 'User' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await expect(page.locator('.reel-info-sheet .masonry-feed')).toBeVisible()
    await page.getByRole('tab', { name: 'Post' }).click()
    await expect(page.getByRole('tab', { name: 'Post' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await expect(page.locator('.reel-info-sheet .masonry-feed')).toBeVisible()

    await page.getByRole('button', { name: 'Close reel information', exact: true }).click()
    await expect(layer).toHaveClass(/vibe-info-sheet-leave-active/)
    await expect(layer).toBeHidden()
  })

  test('supports public media, post, and sheet controls in the base reel', async ({ page }) => {
    await waitForDemo(page)
    const reel = page.locator('.demo-vibe-host .reel-feed')
    const initialPostId = await reel.getAttribute('data-active-post-id')

    expect(await page.evaluate(() => (
      window.__vibeReelInfoSheetDemo?.previousReelPost()
    ))).toBe(false)
    expect(await page.evaluate(() => (
      window.__vibeReelInfoSheetDemo?.nextReelPost()
    ))).toBe(true)
    await expect.poll(() => reel.getAttribute('data-active-post-id')).not.toBe(initialPostId)
    expect(await page.evaluate(() => {
      const vibe = window.__vibeReelInfoSheetDemo
      if (!vibe) return false

      for (let index = 0; index < vibe.getState().items.length; index += 1) {
        if (vibe.nextReelMediaItem()) return true
        if (!vibe.nextReelPost()) return false
      }
      return false
    })).toBe(true)
    await expect(reel).toHaveAttribute('data-active-media-index', '1')

    await page.evaluate(() => window.__vibeReelInfoSheetDemo?.setReelInfoSheet(true))
    await expect(page.getByRole('dialog', { name: 'Reel information' })).toBeVisible()
    await page.evaluate(() => window.__vibeReelInfoSheetDemo?.setReelInfoSheet(false))
    await expect(page.getByRole('dialog', { name: 'Reel information' })).toBeHidden()
  })

})

test.describe('masonry reel resized to phone width', () => {
  test.use({
    hasTouch: true,
    isMobile: true,
    screen: { width: 1440, height: 900 },
    viewport: { width: 1440, height: 900 },
  })

  test('clears the sheet when the phone-width reel closes', async ({ page }) => {
    await openMasonrySheet(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await expect(page.getByRole('dialog', { name: 'Reel information' })).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page.locator('.vibe-reel-overlay')).toBeHidden()

    await page.setViewportSize({ width: 1440, height: 900 })
    await page.locator('.demo-vibe-host .masonry-item').nth(1).click()
    await expect(page.locator('.vibe-reel-overlay')).toBeVisible()
    await expect(page.locator('[data-test="reel-info-sheet"]')).toBeHidden()
  })
})

test.describe('tablet reel information sheet', () => {
  test.use({
    hasTouch: true,
    isMobile: true,
    screen: { width: 820, height: 1180 },
    viewport: { width: 820, height: 1180 },
  })

  test('participates below the reel at full width and stays open across swipes', async ({ page }) => {
    await openMasonrySheet(page)
    await expect(page.locator('[data-test="reel-info-sheet"]'))
      .not.toHaveClass(/vibe-info-sheet-enter-active/)
    const layoutBox = await page.locator('.vibe-reel-overlay .reel-layout').boundingBox()
    const mainBox = await page.locator('.vibe-reel-overlay .reel-layout-main').boundingBox()
    const layerBox = await page.locator('[data-test="reel-info-sheet"]').boundingBox()

    expect(layoutBox).not.toBeNull()
    expect(mainBox).not.toBeNull()
    expect(layerBox).not.toBeNull()
    expect(Math.abs((layerBox?.width ?? 0) - (layoutBox?.width ?? 0))).toBeLessThan(2)
    expect(layerBox?.y ?? 0).toBeGreaterThanOrEqual((mainBox?.y ?? 0) + (mainBox?.height ?? 0) - 2)
    expect((layerBox?.height ?? 0) / (layoutBox?.height ?? 1)).toBeCloseTo(0.5, 2)
    const sheetBox = await page.locator('.reel-info-sheet').boundingBox()
    expect(Math.abs((sheetBox?.height ?? 0) - (layerBox?.height ?? 0))).toBeLessThan(2)
    await expectPersistentAcrossPostChange(page)
  })
})

test.describe('desktop reel information sheet', () => {
  test.use({
    screen: { width: 1440, height: 900 },
    viewport: { width: 1440, height: 900 },
  })

  test('uses a 25% side panel and preserves masonry after closing', async ({ page }) => {
    await waitForDemo(page)
    const masonry = page.locator('.demo-vibe-host > .vibe-surface > .masonry-feed-shell .masonry-feed')
    await page.locator('.demo-vibe-host .masonry-item').first().click()
    await expect(page.locator('.vibe-reel-overlay')).toBeVisible()
    const originalScrollTop = await masonry.evaluate((element) => {
      element.scrollTop = 200
      element.setAttribute('data-e2e-identity', 'stable')
      return element.scrollTop
    })
    expect(originalScrollTop).toBeGreaterThan(0)
    await page.getByRole('button', { name: 'Open reel information sheet' }).click()
    await expect(page.locator('[data-test="reel-info-sheet"]'))
      .not.toHaveClass(/vibe-info-sheet-enter-active/)

    const layoutBox = await page.locator('.vibe-reel-overlay .reel-layout').boundingBox()
    const layerBox = await page.locator('[data-test="reel-info-sheet"]').boundingBox()
    expect((layerBox?.width ?? 0) / (layoutBox?.width ?? 1)).toBeCloseTo(0.25, 2)
    const sheetBox = await page.locator('.reel-info-sheet').boundingBox()
    expect(Math.abs((sheetBox?.height ?? 0) - (layoutBox?.height ?? 0))).toBeLessThan(2)
    await expectPersistentAcrossPostChange(page)

    await page.getByRole('tab', { name: 'Post' }).click()
    const sparseFeed = page.locator('.reel-info-sheet .masonry-feed')
    await expect(sparseFeed).toBeVisible()
    const sparseMasonry = sparseFeed.locator('.masonry')
    const sparseFeedBox = await sparseFeed.boundingBox()
    const sparseMasonryBox = await sparseMasonry.boundingBox()
    expect((sparseFeedBox?.height ?? 0) - (sparseMasonryBox?.height ?? 0)).toBeLessThan(40)
    expect(await sparseMasonry.evaluate((element) => (
      element.getBoundingClientRect().height >= Number.parseFloat(element.style.height)
    ))).toBe(true)

    await page.keyboard.press('Escape')
    await expect(page.locator('.vibe-reel-overlay')).toBeHidden()
    await expect(masonry).toHaveAttribute('data-e2e-identity', 'stable')
    expect(await masonry.evaluate((element) => element.scrollTop)).toBe(originalScrollTop)

    await page.locator('.demo-vibe-host .masonry-item').first().click()
    await expect(page.locator('.vibe-reel-overlay')).toBeVisible()
    await expect(page.locator('[data-test="reel-info-sheet"]')).toBeVisible()
    await page.getByRole('button', { name: 'Close reel information', exact: true }).click()
    await expect(page.locator('[data-test="reel-info-sheet"]')).toBeHidden()
    await page.keyboard.press('Escape')
    await expect(page.locator('.vibe-reel-overlay')).toBeHidden()
  })

  test('Escape returns a nested reel to its sheet feed without closing the parent', async ({ page }) => {
    await openMasonrySheet(page)
    const parentOverlay = page.locator(
      '.demo-vibe-host > .vibe-surface > .vibe-reel-overlay',
    )
    const sheet = parentOverlay.locator('[data-test="reel-info-sheet"]')
    const nestedFeed = sheet.locator('.demo-info-sheet-feed')
    const nestedOverlay = nestedFeed.locator(':scope > .vibe-surface > .vibe-reel-overlay')

    await nestedFeed.locator('.masonry-item').first().click()
    await expect(nestedOverlay).toBeVisible()
    await page.keyboard.press('Escape')

    await expect(nestedOverlay).toBeHidden()
    await expect(parentOverlay).toBeVisible()
    await expect(sheet).toBeVisible()
    await expect(nestedFeed.locator('.masonry-feed')).toBeVisible()
  })

  test('offers manual pagination when an infinite sheet feed is underfilled', async ({ page }) => {
    await page.route('**/data/civitai/images/page-01.json', async (route) => {
      const response = await route.fetch()
      const fixture = await response.json() as {
        items: unknown[]
        metadata: Record<string, unknown>
      }
      await route.fulfill({
        response,
        json: { ...fixture, items: fixture.items.slice(0, 1) },
      })
    })
    await openMasonrySheet(page)
    const sheet = page.locator('.reel-info-sheet')
    const cards = sheet.locator('.masonry-item')
    const initialCount = await cards.count()
    const loadMore = sheet.getByRole('button', { name: 'Load more' })

    expect(await sheet.locator('.masonry').evaluate((masonry) => {
      const gallery = masonry.closest('.gallery-shell')
      return gallery !== null
        && masonry.getBoundingClientRect().bottom <= gallery.getBoundingClientRect().bottom + 1
    })).toBe(true)
    await expect(loadMore).toBeVisible()
    await loadMore.click()
    await expect.poll(() => cards.count()).toBeGreaterThan(initialCount)
    await expect.poll(() => sheet.locator('.masonry').evaluate((masonry) => {
      const gallery = masonry.closest('.gallery-shell')
      return gallery !== null
        && masonry.getBoundingClientRect().bottom > gallery.getBoundingClientRect().bottom + 1
    })).toBe(true)
    await expect(loadMore).toBeHidden()
  })

  test('supports public post navigation in a masonry-origin reel', async ({ page }) => {
    await waitForDemo(page)
    expect(await page.evaluate(() => (
      window.__vibeReelInfoSheetDemo?.nextReelPost()
    ))).toBe(false)

    await page.locator('.demo-vibe-host .masonry-item').first().click()
    const reel = page.locator('.vibe-reel-overlay .reel-feed')
    const initialPostId = await reel.getAttribute('data-active-post-id')
    expect(await page.evaluate(() => (
      window.__vibeReelInfoSheetDemo?.nextReelPost()
    ))).toBe(true)
    await expect.poll(() => reel.getAttribute('data-active-post-id')).not.toBe(initialPostId)
  })
})

test.describe('wide reel information sheet', () => {
  test.use({
    screen: { width: 1920, height: 1080 },
    viewport: { width: 1920, height: 1080 },
  })

  test('uses a 40% side panel at 1920px', async ({ page }) => {
    await openMasonrySheet(page)
    await expect(page.locator('[data-test="reel-info-sheet"]'))
      .not.toHaveClass(/vibe-info-sheet-enter-active/)
    const layoutBox = await page.locator('.vibe-reel-overlay .reel-layout').boundingBox()
    const layerBox = await page.locator('[data-test="reel-info-sheet"]').boundingBox()

    expect((layerBox?.width ?? 0) / (layoutBox?.width ?? 1)).toBeCloseTo(0.4, 2)
  })
})
