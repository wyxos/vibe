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

async function expectPersistentAcrossSwipe(page: Page): Promise<void> {
  const sheet = page.locator('[data-test="reel-info-sheet"]')
  await expect(sheet).not.toHaveClass(/vibe-info-sheet-enter-active/)
  const reel = page.locator('.vibe-reel-overlay .reel-feed')
  const firstPostId = await reel.getAttribute('data-active-post-id')
  await sheet.evaluate((element) => { element.setAttribute('data-e2e-identity', 'stable') })
  const reelBox = await reel.boundingBox()
  expect(reelBox).not.toBeNull()
  await page.mouse.move(
    (reelBox?.x ?? 0) + (reelBox?.width ?? 0) / 2,
    (reelBox?.y ?? 0) + (reelBox?.height ?? 0) / 2,
  )
  await page.mouse.wheel(0, reelBox?.height ?? 600)

  await expect.poll(() => reel.getAttribute('data-active-post-id')).not.toBe(firstPostId)
  await expect(sheet).toHaveAttribute('data-e2e-identity', 'stable')
  await expect(page.locator('.demo-reel-info-sheet')).toHaveAttribute(
    'data-context-post-id',
    await reel.getAttribute('data-active-post-id') ?? '',
  )
}

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
    await expectPersistentAcrossSwipe(page)
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
    await expectPersistentAcrossSwipe(page)

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
