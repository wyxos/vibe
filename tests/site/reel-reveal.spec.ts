import { expect, test, type Page, type Route } from '@playwright/test'

const overlay = '.vibe-reel-overlay'
const image = '/media/image-01.webp'
const evidence = process.env.VIBE_SITE_REVIEW_DIR

// Pause real browser transitions at their start rather than replacing the
// slide, guessing elapsed time, or synthesizing completion events.
async function controlTransitions(page: Page) {
  await page.addInitScript(() => {
    document.addEventListener('transitionrun', (event) => {
      const element = event.target
      if (!(element instanceof HTMLElement) || !(event instanceof TransitionEvent)) return
      const isSlide = element.matches('.vibe-reel-overlay.vibe-reel-viewer-enter-active')
        && event.propertyName === 'transform'
      const isFade = element.matches('.vibe-reel-overlay .reel-layout-main')
        && event.propertyName === 'opacity'
      if (!isSlide && !isFade) return
      const animation = element.getAnimations().find((candidate) => candidate instanceof CSSTransition
        && candidate.transitionProperty === event.propertyName)
      if (!animation) return
      animation.pause()
      element.setAttribute('data-test-paused-transition', event.propertyName)
    }, true)
  })
}

async function finishTransition(page: Page, selector: string, property: string) {
  await page.locator(selector).evaluate(async (element, name) => {
    const animation = element.getAnimations().find((candidate) => candidate instanceof CSSTransition
      && candidate.transitionProperty === name)
    if (!animation) throw new Error(`Missing paused ${name} transition`)
    const ended = new Promise<void>((resolve) => {
      element.addEventListener('transitionend', function onEnd(event) {
        if (event.target !== element || (event as TransitionEvent).propertyName !== name) return
        element.removeEventListener('transitionend', onEnd)
        resolve()
      })
    })
    animation.play()
    await ended
    element.removeAttribute('data-test-paused-transition')
  }, property)
}

async function ready(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await expect(page.locator('.masonry-item').first()).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  return errors
}

async function openFirst(page: Page, selector = '.masonry-item') {
  // Vue also has a transition fallback timer. Hold that timer while inspecting
  // the native animation, then advance only its two opening animation frames.
  await page.clock.install()
  await page.clock.pauseAt(await page.evaluate(() => Date.now() + 1000))
  await page.locator(selector).first().click({ position: { x: 20, y: 20 } })
  await page.clock.runFor(48)
  await expect(page.locator(overlay)).toBeVisible()
}

async function waiting(page: Page) {
  await expect(page.locator(overlay)).toHaveAttribute('data-demo-reel-entry', 'waiting')
  await expect(page.getByRole('status', { name: 'Loading media', exact: true })).toBeVisible()
  await expect(page.locator(`${overlay} .reel-layout-main`)).toHaveCSS('opacity', '0')
}

async function finishFade(page: Page) {
  const main = page.locator(`${overlay} .reel-layout-main`)
  await expect(page.locator(overlay)).toHaveAttribute('data-demo-reel-entry', 'revealing')
  await expect(main).toHaveAttribute('data-test-paused-transition', 'opacity')
  const timing = await main.evaluate((element) => {
    const style = getComputedStyle(element)
    return { duration: style.transitionDuration, property: style.transitionProperty }
  })
  expect(timing.duration).toBe('0.16s')
  expect(timing.property).toContain('opacity')
  await finishTransition(page, `${overlay} .reel-layout-main`, 'opacity')
  await expect(page.locator(overlay)).toHaveAttribute('data-demo-reel-entry', 'ready')
  await expect(main).toHaveCSS('opacity', '1')
  await expect(page.locator('.demo-reel-spinner')).toBeHidden()
  await page.clock.resume()
}

async function capture(page: Page, name: string) {
  if (evidence && process.env.VIBE_TEST_NO_VISUALS !== '1') {
    await page.screenshot({ path: `${evidence}/${name}.png` })
  }
}

function holdImage(page: Page, source = image) {
  let release!: () => void
  const held = new Promise<void>((resolve) => { release = resolve })
  let blocked!: () => void
  const requested = new Promise<void>((resolve) => { blocked = resolve })
  const handler = async (route: Route) => {
    blocked()
    await held
    await route.continue()
  }
  return { install: () => page.route(`**${source}`, handler), release, requested }
}

for (const viewport of [{ width: 1440, height: 960 }, { width: 390, height: 844 }]) {
  const size = viewport.width === 390 ? 'phone' : 'desktop'
  test(`cold ${size}: slide finishes before held media and whole item fades together`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await controlTransitions(page)
    const media = holdImage(page)
    await media.install()
    const errors = await ready(page)
    await media.requested
    await openFirst(page)
    await expect(page.locator(overlay)).toHaveAttribute('data-test-paused-transition', 'transform')
    await waiting(page)
    expect(await page.locator(overlay).evaluate((element) => getComputedStyle(element).transitionDuration)).toBe('0.16s')
    expect(await page.locator(overlay).evaluate((element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).m41)).toBeLessThan(0)
    await finishTransition(page, overlay, 'transform')
    await waiting(page)
    await capture(page, `reel-${size}-waiting`)
    media.release()
    await finishFade(page)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await capture(page, `reel-${size}-ready`)
    expect(errors).toEqual([])
  })

  test(`warm ${size}: decoded media still waits for the actual slide completion`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await controlTransitions(page)
    const errors = await ready(page)
    await page.locator('.masonry-item img').first().evaluate(async (element) => {
      await (element as HTMLImageElement).decode()
    })
    await openFirst(page)
    await expect(page.locator(overlay)).toHaveAttribute('data-test-paused-transition', 'transform')
    await expect(page.locator(`${overlay} .reel-item img`).first()).toHaveClass(/media-preview--ready/)
    await waiting(page)
    await finishTransition(page, overlay, 'transform')
    await finishFade(page)
    await page.keyboard.press('Escape')
    await page.clock.resume()
    await expect(page.locator(overlay)).toHaveCount(0)
    await expect(page.locator('.masonry-feed')).toBeVisible()
    expect(errors).toEqual([])
  })
}

test('Escape during opening releases the old entry and reopening starts cleanly', async ({ page }) => {
  await controlTransitions(page)
  const media = holdImage(page)
  await media.install()
  const errors = await ready(page)
  await openFirst(page)
  await expect(page.locator(overlay)).toHaveAttribute('data-test-paused-transition', 'transform')
  await waiting(page)
  await page.keyboard.press('Escape')
  await page.clock.resume()
  await expect(page.locator(overlay)).toHaveCount(0)
  media.release()
  await openFirst(page)
  await expect(page.locator(overlay)).toHaveAttribute('data-test-paused-transition', 'transform')
  await waiting(page)
  await finishTransition(page, overlay, 'transform')
  await finishFade(page)
  expect(errors).toEqual([])
})

test('failed media reveals the real error after the slide without an endless spinner', async ({ page }) => {
  await controlTransitions(page)
  await page.route(`**${image}`, (route) => route.abort('failed'))
  const errors = await ready(page)
  await openFirst(page)
  await expect(page.locator(overlay)).toHaveAttribute('data-test-paused-transition', 'transform')
  await expect(page.locator(`${overlay} .media-error`).first()).toBeAttached()
  await waiting(page)
  await finishTransition(page, overlay, 'transform')
  await finishFade(page)
  await expect(page.locator(`${overlay} .media-error`).first()).toBeVisible()
  await capture(page, 'reel-media-error')
  expect(errors).toEqual([])
})

test('reduced motion still waits for media and can close and reopen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const media = holdImage(page)
  await media.install()
  const errors = await ready(page)
  await openFirst(page)
  await waiting(page)
  media.release()
  await expect(page.locator(overlay)).toHaveAttribute('data-demo-reel-entry', 'ready')
  await expect(page.locator(`${overlay} .reel-layout-main`)).toHaveCSS('opacity', '1')
  await expect(page.locator('.demo-reel-spinner')).toBeHidden()
  await page.keyboard.press('Escape')
  await page.clock.resume()
  await expect(page.locator(overlay)).toHaveCount(0)
  await openFirst(page)
  await expect(page.locator(overlay)).toHaveAttribute('data-demo-reel-entry', 'ready')
  expect(errors).toEqual([])
})

test('the actual video fixture reaches readiness before its whole item appears', async ({ page }) => {
  await controlTransitions(page)
  const errors = await ready(page)
  await page.locator('[data-test=filter-video]').click()
  await expect(page.locator('[data-test=request-state]')).toHaveText('Ready to explore')
  await expect(page.locator('.masonry-item video').first()).toHaveClass(/media-preview--ready/)
  await openFirst(page)
  await expect(page.locator(overlay)).toHaveAttribute('data-test-paused-transition', 'transform')
  const video = page.locator(`${overlay} .reel-item video`).first()
  await expect(video).toHaveClass(/media-preview--ready/)
  expect(await video.evaluate((element) => (element as HTMLVideoElement).readyState)).toBeGreaterThanOrEqual(2)
  await waiting(page)
  await finishTransition(page, overlay, 'transform')
  await finishFade(page)
  expect(errors).toEqual([])
})

test('changing grouped media while opening waits for the current frame', async ({ page }) => {
  await controlTransitions(page)
  const media = holdImage(page, '/media/image-03.webp')
  await media.install()
  const errors = await ready(page)
  await page.locator('[data-test=filter-image]').click()
  await expect(page.locator('[data-test=request-state]')).toHaveText('Ready to explore')
  await page.locator('.masonry-feed').evaluate((element) => { element.scrollTop = element.scrollHeight })
  const card = '.masonry-item[data-post-id*="landscape-pair"]'
  await expect(page.locator(card).first()).toBeAttached()
  await page.locator(card).first().scrollIntoViewIfNeeded()
  await openFirst(page, card)
  await expect(page.locator(overlay)).toHaveAttribute('data-test-paused-transition', 'transform')
  await expect(page.locator(`${overlay} .reel-item[data-post-id*="landscape-pair"] img`).first())
    .toHaveClass(/media-preview--ready/)
  await page.keyboard.press('ArrowRight')
  await expect(page.locator(`${overlay} .reel-feed`)).toHaveAttribute('data-active-media-index', '1')
  await media.requested
  await finishTransition(page, overlay, 'transform')
  await waiting(page)
  media.release()
  await finishFade(page)
  expect(errors).toEqual([])
})



