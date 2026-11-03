import { expect, test, type Page } from '@playwright/test'
import type {} from '../browser/harness'

async function open(page: Page, query = '') {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(`/?${query}`)
  await expect(page.locator('body')).toHaveAttribute('data-ready', 'true')
  return errors
}

test('custom card regions receive context and do not activate the reel', async ({ page }) => {
  const errors = await open(page, 'chrome')
  const card = page.locator('.masonry-item').first()
  await expect(card).toHaveClass(/media-card--transparent-chrome/)
  for (const region of ['.media-card-header', '.media-card-footer']) {
    await expect(card.locator(region)).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)')
  }
  await card.getByRole('button', { name: 'Information 1', exact: true }).click()
  await expect(card.locator('[data-test=custom-details]')).toBeVisible()
  const like = card.getByRole('button', { name: 'Like', exact: true })
  await like.click()
  await expect(like).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.vibe-reel-overlay')).toHaveCount(0)
  expect(errors).toEqual([])
})

test('masonry activation and Escape preserve feed focus and scrolling', async ({ page }) => {
  await open(page)
  const feed = page.locator('.masonry-feed')
  await feed.evaluate((element) => { element.scrollTop = 600 })
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
  const id = await page.locator('.masonry-item').evaluateAll((cards) => (
    (cards.find((card) => {
      const rect = card.getBoundingClientRect()
      return rect.top >= 0 && rect.bottom <= innerHeight
    }) as HTMLElement).dataset.postId
  ))
  const card = page.locator(`.masonry-item[data-post-id="${id}"]`)
  const activator = card
  const scrollTop = await feed.evaluate((element) => element.scrollTop)
  await activator.click()
  await expect(page.locator('.vibe-reel-overlay')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.locator('.vibe-reel-overlay')).toHaveCount(0)
  await expect(card).toBeFocused()
  expect(await feed.evaluate((element) => element.scrollTop)).toBe(scrollTop)
})

test('closeReel supports custom controls without a built-in return button', async ({ page }) => {
  await open(page)
  const card = page.locator('.masonry-item').first()
  await card.click()
  await expect(page.locator('.vibe-reel-overlay')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Back to feed', exact: true })).toHaveCount(0)
  await page.evaluate(() => window.__vibe.closeReel())
  await expect(page.locator('.vibe-reel-overlay')).toHaveCount(0)
  await expect(card).toBeFocused()
  await page.evaluate(() => window.__vibe.closeReel())
  await expect(page.locator('.masonry-feed')).toBeVisible()
})

test('reduced motion suppresses reel travel', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await open(page)
  await page.locator('.masonry-item').first().click()
  const overlay = page.locator('.vibe-reel-overlay')
  await expect(overlay).toBeVisible()
  expect(await overlay.evaluate((element) => element.getAnimations().some((animation) => (
    animation instanceof CSSTransition && animation.transitionProperty === 'transform'
  )))).toBe(false)
})

test('normal motion completes reel entry and exit transitions', async ({ page }) => {
  await open(page)
  await page.evaluate(() => {
    document.body.dataset.transition = ''
    document.addEventListener('transitionrun', (event) => {
      if (event instanceof TransitionEvent && event.propertyName === 'transform'
        && (event.target as HTMLElement).classList.contains('vibe-reel-overlay')) {
        document.body.dataset.transition = 'transform'
      }
    }, true)
  })
  await page.locator('.masonry-item').first().click()
  await expect(page.locator('body')).toHaveAttribute('data-transition', 'transform')
  const overlay = page.locator('.vibe-reel-overlay')
  await expect(overlay).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(overlay).toHaveCount(0)
})

test('auto scroll starts, pauses, resumes and stops', async ({ page }) => {
  await open(page, 'layout=masonry')
  const feed = page.locator('.masonry-feed')
  const position = () => feed.evaluate((element) => element.scrollTop)
  await page.evaluate(() => window.__vibe.setAutoScroll(true, 240))
  await expect.poll(position).toBeGreaterThan(20)
  await page.evaluate(() => window.__vibe.pauseAutoScroll())
  const paused = await position()
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
  expect(await position()).toBe(paused)
  await page.evaluate(() => window.__vibe.resumeAutoScroll())
  await expect.poll(position).toBeGreaterThan(paused + 20)
  await page.evaluate(() => window.__vibe.setAutoScroll(false))
  const stopped = await position()
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
  expect(await position()).toBe(stopped)
})

test('locked pagination is disabled and resumes using the library footer', async ({ page }) => {
  await open(page)
  await page.evaluate(() => window.__vibe.setLoadMoreLocked(true))
  await page.locator('.masonry-feed').evaluate((element) => { element.scrollTop = element.scrollHeight })
  await expect(page.getByRole('button', { name: 'Loading paused' })).toBeDisabled()
  expect(await page.evaluate(() => window.__requests)).toBe(0)
  await page.evaluate(() => window.__vibe.setLoadMoreLocked(false))
  await page.getByRole('button', { name: 'Load more', exact: true }).click()
  await expect.poll(() => page.evaluate(() => window.__state.items.length)).toBe(50)
  expect(await page.evaluate(() => window.__requests)).toBe(1)
})

test('animated removal and undo preserve ordering', async ({ page }) => {
  await open(page, 'chrome')
  await page.evaluate(() => {
    void window.__vibe.removeItems([1]).then(() => { document.body.dataset.removed = 'true' })
  })
  await expect(page.locator('.masonry-item[data-post-id="1"]')).toHaveClass(/media-card--leaving/)
  await expect(page.locator('body')).toHaveAttribute('data-removed', 'true')
  await expect(page.locator('.masonry-item[data-post-id="1"]')).toHaveCount(0)
  await expect(page.locator('[data-test=position]').first()).toHaveText('1 / 39')
  await page.evaluate(() => window.__vibe.undoLastRemoval())
  await expect(page.locator('.masonry-item').first()).toHaveAttribute('data-post-id', '1')
  await expect(page.locator('[data-test=position]').first()).toHaveText('1 / 40')
})

test('removing the active reel post advances without closing its overlay', async ({ page }) => {
  await open(page)
  await page.locator('.masonry-item').first().click()
  const overlay = page.locator('.vibe-reel-overlay')
  await expect(overlay).toBeVisible()
  await page.evaluate(() => window.__vibe.removeItems([1]))
  await expect(overlay).toBeVisible()
  await expect(overlay.locator('.reel-feed')).not.toHaveAttribute('data-active-post-id', '1')
})

test('visible grouped posts preload children but overscan posts do not', async ({ page }) => {
  const requests = new Set<string>()
  page.on('request', (request) => requests.add(new URL(request.url()).pathname))
  await open(page)
  const mounted = await page.locator('.masonry-item').evaluateAll((cards) => cards.map((card) => {
    const rect = card.getBoundingClientRect()
    return { id: (card as HTMLElement).dataset.postId!, visible: rect.bottom > 0 && rect.top < innerHeight }
  }))
  const visible = mounted.find((card) => card.visible)!
  const overscan = mounted.find((card) => !card.visible)!
  expect(visible).toBeDefined()
  expect(overscan).toBeDefined()
  await expect.poll(() => requests.has(`/media/${visible.id}-1-preview.svg`)).toBe(true)
  // A pair of render frames lets all viewport observer callbacks settle.
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
  expect(requests.has(`/media/${overscan.id}-1-preview.svg`)).toBe(false)
  const card = page.locator(`.masonry-item[data-post-id="${visible.id}"]`)
  await card.hover()
  await card.locator('.media-carousel-control--next').click()
  await expect(card.locator('img')).toHaveCount(1)
  await expect(card.locator('img')).toHaveAttribute('src', `/media/${visible.id}-1-preview.svg`)
  await expect.poll(() => card.locator('img').evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true)
})

test('bottom space and pagination threshold use the actual scroll range', async ({ page }) => {
  await open(page, 'layout=masonry&bottomSpace=350&threshold=80')
  const feed = page.locator('.masonry-feed')
  await page.evaluate(() => window.__vibe.setInfiniteScroll(true))
  await feed.evaluate((element) => { element.scrollTop = element.scrollHeight - element.clientHeight - 140 })
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))))
  expect(await page.evaluate(() => window.__requests)).toBe(0)
  await feed.evaluate((element) => { element.scrollTop = element.scrollHeight - element.clientHeight - 60 })
  await expect.poll(() => page.evaluate(() => window.__requests)).toBe(1)
  await expect.poll(() => page.evaluate(() => window.__state.items.length)).toBe(50)
})

test('single-media removal and restoration update the carousel', async ({ page }) => {
  await open(page)
  const removal = await page.evaluateHandle(() => window.__vibe.removeMedia({ postId: 1, mediaIndex: 1 }))
  expect(await removal.jsonValue()).not.toBeNull()
  await expect.poll(() => page.evaluate(() => window.__state.items[0]!.items.length)).toBe(1)
  expect(await page.evaluate((saved) => window.__vibe.restoreMediaRemoval(saved!), removal)).toBe(true)
  await removal.dispose()
  await expect.poll(() => page.evaluate(() => window.__state.items[0]!.items.length)).toBe(2)
  const card = page.locator('.masonry-item').first()
  await card.hover()
  await card.locator('.media-carousel-control--next').click()
  await expect.poll(() => page.evaluate(() => window.__vibe.getState().items[0]!.items.length)).toBe(2)
  await expect(card.locator('img')).toHaveCount(1)
  await expect(card.locator('img')).toHaveAttribute('src', '/media/1-1-preview.svg')
})
