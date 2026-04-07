import type { Locator } from '@playwright/test'

import { expect, gotoRoute, test } from './fixtures'

test('workspace header opens a right-side menu with navigation routes', async ({ page }) => {
  await gotoRoute(page, '/')

  const menuButton = page.getByTestId('workspace-menu-button')
  const menuSheet = page.getByTestId('workspace-menu-sheet')

  await expect(menuButton).toBeVisible()
  await expect(menuSheet).toHaveAttribute('data-open', 'false')

  await menuButton.click()

  await expect(menuSheet).toHaveAttribute('data-open', 'true')
  await expect(menuSheet.getByRole('link', { name: 'Manual Paging Demo' })).toBeVisible()

  await menuSheet.getByRole('link', { name: 'Manual Paging Demo' }).click()

  await expect(page).toHaveURL(/\/demo\/bidirectional-paging$/)
  await expect(menuSheet).toHaveAttribute('data-open', 'false')
})

test('desktop home viewer starts in the masonry list and virtualizes visible cards', async ({ page }) => {
  await page.setViewportSize({
    width: 2_560,
    height: 1_440,
  })

  await gotoRoute(page, '/')

  const root = page.getByTestId('vibe-root')
  const listSurface = page.getByTestId('vibe-root-list-surface')
  const progress = listSurface.getByTestId('vibe-root-pagination')
  const cards = listSurface.getByTestId('vibe-list-card')

  await expect(root).toBeVisible()
  await expect(root).toHaveAttribute('data-surface-mode', 'list')
  await expect(listSurface.getByTestId('vibe-list-scroll')).toBeVisible()
  await expect(listSurface.getByTestId('vibe-list-scrollbar-thumb')).toBeVisible()
  await expect.poll(async () => (await getPaginationState(progress)).active).toBe(1)
  await expect.poll(async () => (await getPaginationState(progress)).total).toBeGreaterThanOrEqual(25)
  await expect.poll(async () => cards.count()).toBeGreaterThan(0)
  await expect.poll(async () => {
    return cards.evaluateAll((nodes) => {
      return new Set(nodes.map((node) => Math.round((node as HTMLElement).getBoundingClientRect().left))).size
    })
  }).toBeGreaterThan(1)
  await expect(page.getByRole('button', { name: 'Retry' })).toHaveCount(0)
})

test('desktop home viewer opens fullscreen from a tile and can return to the list', async ({ page }) => {
  await page.setViewportSize({
    width: 1_100,
    height: 650,
  })

  await gotoRoute(page, '/')

  const root = page.getByTestId('vibe-root')
  const listSurface = page.getByTestId('vibe-root-list-surface')
  const fullscreenSurface = page.getByTestId('vibe-root-fullscreen-surface')
  const cards = listSurface.getByTestId('vibe-list-card')
  const progress = fullscreenSurface.getByTestId('vibe-root-pagination')

  await expect(root).toHaveAttribute('data-surface-mode', 'list')
  await expect(listSurface).toHaveAttribute('data-visible', 'true')
  await expect(fullscreenSurface).toHaveAttribute('data-visible', 'false')
  await expect.poll(async () => cards.count()).toBeGreaterThan(1)

  await cards.nth(1).locator('button').click()

  await expect(root).toHaveAttribute('data-surface-mode', 'fullscreen')
  await expect(listSurface).toHaveAttribute('data-visible', 'false')
  await expect(fullscreenSurface).toHaveAttribute('data-visible', 'true')
  await expect(progress).toContainText('2 / 25')
  await expect(page.getByTestId('vibe-root-back-to-list')).toBeVisible()

  await page.getByTestId('vibe-root-back-to-list').click()

  await expect(root).toHaveAttribute('data-surface-mode', 'list')
  await expect(listSurface).toHaveAttribute('data-visible', 'true')
  await expect(fullscreenSurface).toHaveAttribute('data-visible', 'false')
  await expect(page.getByTestId('vibe-root-back-to-list')).toHaveCount(0)
})

test('desktop home viewer auto-loads the next page and keeps the list virtualized after returning', async ({ page }) => {
  await page.setViewportSize({
    width: 1_100,
    height: 650,
  })

  await gotoRoute(page, '/')

  const root = page.getByTestId('vibe-root')
  const listSurface = page.getByTestId('vibe-root-list-surface')
  const fullscreenSurface = page.getByTestId('vibe-root-fullscreen-surface')
  const listProgress = listSurface.getByTestId('vibe-root-pagination')
  const fullscreenProgress = fullscreenSurface.getByTestId('vibe-root-pagination')
  const cards = listSurface.getByTestId('vibe-list-card')

  await expect(root).toHaveAttribute('data-surface-mode', 'list')
  await expect(listProgress).toHaveText('1 / 25', { timeout: 15_000 })
  await expect.poll(async () => cards.count()).toBeGreaterThan(0)

  await cards.nth(0).locator('button').click()

  await expect(root).toHaveAttribute('data-surface-mode', 'fullscreen')

  for (let step = 0; step < 23; step += 1) {
    await page.keyboard.press('ArrowDown')
  }

  await expect.poll(async () => normalizeWhitespace(await fullscreenProgress.textContent())).toContain('/ 50')
  await page.getByTestId('vibe-root-back-to-list').click()
  await expect(root).toHaveAttribute('data-surface-mode', 'list')
  await expect.poll(async () => cards.count()).toBeLessThan(50)
})

test('desktop masonry list scroll loads one page per bottom hit', async ({ page }) => {
  await page.setViewportSize({
    width: 2_560,
    height: 1_207,
  })

  await gotoRoute(page, '/')

  const root = page.getByTestId('vibe-root')
  const listSurface = page.getByTestId('vibe-root-list-surface')
  const progress = listSurface.getByTestId('vibe-root-pagination')
  const scrollViewport = listSurface.getByTestId('vibe-list-scroll')

  await expect(root).toHaveAttribute('data-surface-mode', 'list')
  await expect.poll(async () => (await getPaginationState(progress)).active).toBe(1)
  await expect.poll(async () => (await getPaginationState(progress)).total).toBeGreaterThanOrEqual(25)
  const initialPagination = await getPaginationState(progress)

  await scrollViewport.evaluate((element) => {
    const node = element as HTMLElement
    node.scrollTop = node.scrollHeight
    node.dispatchEvent(new Event('scroll', { bubbles: true }))
    for (let index = 0; index < 8; index += 1) {
      node.dispatchEvent(new WheelEvent('wheel', {
        bubbles: true,
        deltaY: 180,
      }))
    }
  })

  await expect.poll(async () => (await getPaginationState(progress)).total).toBeGreaterThan(initialPagination.total)
  const afterFirstLoad = await getPaginationState(progress)

  await scrollViewport.evaluate((element) => {
    const node = element as HTMLElement
    node.scrollTop = node.scrollHeight
    node.dispatchEvent(new Event('scroll', { bubbles: true }))
    node.dispatchEvent(new WheelEvent('wheel', {
      bubbles: true,
      deltaY: 180,
    }))
  })
  await page.waitForTimeout(1_200)
  await expect.poll(async () => (await getPaginationState(progress)).total).toBe(afterFirstLoad.total)

  await page.waitForTimeout(1_400)
  await scrollViewport.evaluate((element) => {
    const node = element as HTMLElement
    node.scrollTop = Math.max(0, node.scrollHeight - node.clientHeight - 240)
    node.dispatchEvent(new Event('scroll', { bubbles: true }))
  })
  await scrollViewport.evaluate((element) => {
    const node = element as HTMLElement
    node.scrollTop = node.scrollHeight
    node.dispatchEvent(new Event('scroll', { bubbles: true }))
    node.dispatchEvent(new WheelEvent('wheel', {
      bubbles: true,
      deltaY: 180,
    }))
  })

  await expect.poll(async () => (await getPaginationState(progress)).total).toBeGreaterThan(afterFirstLoad.total)
})

test('desktop fullscreen seekbar moves the active video forward instead of snapping back', async ({ page }) => {
  await page.setViewportSize({
    width: 1_100,
    height: 650,
  })

  await gotoRoute(page, '/')

  const root = page.getByTestId('vibe-root')
  const listSurface = page.getByTestId('vibe-root-list-surface')
  const fullscreenSurface = page.getByTestId('vibe-root-fullscreen-surface')
  const videoCard = listSurface.locator('[data-testid="vibe-list-card"][data-index="1"]')

  await expect(root).toHaveAttribute('data-surface-mode', 'list')
  await expect(videoCard).toBeVisible()

  await videoCard.locator('button').click()

  const activeVideo = fullscreenSurface.locator('[data-active="true"] video')
  const seekbar = fullscreenSurface.getByLabel('Seek active media')

  await expect(root).toHaveAttribute('data-surface-mode', 'fullscreen')
  await expect(activeVideo).toBeVisible()
  await expect(seekbar).toBeVisible()
  await expect.poll(async () => {
    return activeVideo.evaluate((video) => Number.isFinite(video.duration) ? video.duration : 0)
  }).toBeGreaterThan(0)

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

test('desktop fullscreen responds to wheel navigation and video click play/pause', async ({ page }) => {
  await page.setViewportSize({
    width: 1_100,
    height: 650,
  })

  await gotoRoute(page, '/')

  const root = page.getByTestId('vibe-root')
  const listSurface = page.getByTestId('vibe-root-list-surface')
  const fullscreenSurface = page.getByTestId('vibe-root-fullscreen-surface')
  const progress = fullscreenSurface.getByTestId('vibe-root-pagination')
  const videoCard = listSurface.locator('[data-testid="vibe-list-card"][data-index="1"]')
  const activeVideo = fullscreenSurface.locator('[data-active="true"] video')

  await expect(root).toHaveAttribute('data-surface-mode', 'list')
  await expect(videoCard).toBeVisible()

  await videoCard.locator('button').click()

  await expect(root).toHaveAttribute('data-surface-mode', 'fullscreen')
  await expect(activeVideo).toBeVisible()
  await expect.poll(async () => activeVideo.evaluate((video) => video.paused)).toBe(false)

  await activeVideo.click()
  await expect.poll(async () => activeVideo.evaluate((video) => video.paused)).toBe(true)

  await activeVideo.click()
  await expect.poll(async () => activeVideo.evaluate((video) => video.paused)).toBe(false)

  await page.mouse.move(550, 325)
  await page.mouse.wheel(0, 720)

  await expect(progress).toContainText('3 / 25')
})

test('desktop fullscreen audio cover toggles play/pause and seekbar updates current time', async ({ page }) => {
  await page.setViewportSize({
    width: 1_100,
    height: 650,
  })

  await gotoRoute(page, '/')

  const root = page.getByTestId('vibe-root')
  const listSurface = page.getByTestId('vibe-root-list-surface')
  const fullscreenSurface = page.getByTestId('vibe-root-fullscreen-surface')
  const imageCard = listSurface.locator('[data-testid="vibe-list-card"][data-index="0"]')

  await expect(root).toHaveAttribute('data-surface-mode', 'list')
  await expect(imageCard).toBeVisible({ timeout: 15_000 })
  await imageCard.locator('button').click()

  for (let step = 0; step < 13; step += 1) {
    await page.keyboard.press('ArrowDown')
  }

  const coverButton = fullscreenSurface.getByRole('button', { name: /Voiceover rough cut/ })
  const activeAudio = fullscreenSurface.locator('[data-active="true"] audio')
  const seekbar = fullscreenSurface.getByLabel('Seek active media')

  await expect(root).toHaveAttribute('data-surface-mode', 'fullscreen')
  await expect(coverButton).toBeVisible()
  await expect(seekbar).toBeVisible()
  await expect.poll(async () => activeAudio.evaluate((audio) => Number.isFinite(audio.duration) ? audio.duration : 0)).toBeGreaterThan(0)
  await expect.poll(async () => activeAudio.evaluate((audio) => audio.paused)).toBe(false)

  await coverButton.click()
  await expect.poll(async () => activeAudio.evaluate((audio) => audio.paused)).toBe(true)

  await coverButton.click()
  await expect.poll(async () => activeAudio.evaluate((audio) => audio.paused)).toBe(false)

  const targetTime = await activeAudio.evaluate((audio) => Math.max(audio.duration * 0.45, 1))

  await seekbar.evaluate((input, nextValue) => {
    const range = input as HTMLInputElement
    range.value = String(nextValue)
    range.dispatchEvent(new Event('input', { bubbles: true }))
  }, targetTime)

  await expect.poll(async () => activeAudio.evaluate((audio) => audio.currentTime)).toBeGreaterThan(1)

  await expect(listSurface).toHaveAttribute('data-visible', 'false')
})

test('desktop grid previews use the preview asset and fullscreen waits for the original image to fade in', async ({ page }) => {
  const previewUrl = 'https://picsum.photos/id/1015/720/480'
  const originalUrl = 'https://picsum.photos/id/1015/2400/1600'
  const previewBody = makeSvgPreview('preview', '#2563eb')
  const originalBody = makeSvgPreview('original', '#dc2626')
  const originalResponseGate = createDeferred<void>()

  await page.route(previewUrl, async (route) => {
    await route.fulfill({
      body: previewBody,
      contentType: 'image/svg+xml',
    })
  })
  await page.route(originalUrl, async (route) => {
    await originalResponseGate.promise
    await route.fulfill({
      body: originalBody,
      contentType: 'image/svg+xml',
    })
  })

  await page.setViewportSize({
    width: 1_100,
    height: 650,
  })

  await gotoRoute(page, '/')

  const root = page.getByTestId('vibe-root')
  const fullscreenSurface = page.getByTestId('vibe-root-fullscreen-surface')
  const previewCard = page.locator('[data-testid="vibe-list-card"][data-index="0"]')
  const previewImage = previewCard.locator('img')
  const fullscreenImage = fullscreenSurface.locator('[data-active="true"] img')

  await expect(root).toHaveAttribute('data-surface-mode', 'list')
  await expect(previewImage).toHaveAttribute('src', previewUrl, { timeout: 15_000 })

  await previewCard.locator('button').click()

  await expect(root).toHaveAttribute('data-surface-mode', 'fullscreen')
  await expect(fullscreenImage).toHaveAttribute('src', originalUrl, { timeout: 15_000 })
  await expect(fullscreenImage).toHaveClass(/opacity-0/)
  await expect(fullscreenSurface.getByTestId('vibe-root-asset-spinner')).toBeVisible()
  originalResponseGate.resolve()
  await expect.poll(async () => fullscreenImage.evaluate((image) => getComputedStyle(image).opacity)).toBe('1')
  await expect(fullscreenSurface.getByTestId('vibe-root-asset-spinner')).toHaveCount(0)
})

test('mobile home viewer always boots in fullscreen mode', async ({ page }) => {
  await page.setViewportSize({
    width: 430,
    height: 932,
  })

  await gotoRoute(page, '/')

  const root = page.getByTestId('vibe-root')
  const progress = page.getByTestId('vibe-root-pagination')

  await expect(root).toHaveAttribute('data-surface-mode', 'fullscreen')
  await expect(page.getByTestId('vibe-list-scroll')).toHaveCount(0)
  await expect(progress).toHaveText('1 / 25', { timeout: 15_000 })

  await page.keyboard.press('ArrowDown')

  await expect(progress).toHaveText('2 / 25')
})

function normalizeWhitespace(value: string | null) {
  return value?.replace(/\s+/g, ' ').trim() ?? ''
}

function makeSvgPreview(label: string, fill: string) {
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">',
    `<rect width="1280" height="720" fill="${fill}" />`,
    '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#fff" font-family="Arial, sans-serif" font-size="64">',
    label,
    '</text>',
    '</svg>',
  ].join('')
}

async function getPaginationState(locator: Locator) {
  const text = normalizeWhitespace(await locator.textContent())
  const match = text.match(/^(\d+)\s*\/\s*(\d+)$/)

  if (!match) {
    return {
      active: -1,
      total: -1,
    }
  }

  return {
    active: Number.parseInt(match[1], 10),
    total: Number.parseInt(match[2], 10),
  }
}

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void

  const promise = new Promise<T>((innerResolve, innerReject) => {
    resolve = innerResolve
    reject = innerReject
  })

  return {
    promise,
    reject,
    resolve,
  }
}
