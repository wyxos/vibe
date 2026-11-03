import { expect, test, type Page } from '@playwright/test'

async function auditMotion(page: Page) {
  await page.locator('[data-test=showcase-stage][data-loading=false]').waitFor()
  await page.evaluate(async () => {
    await Promise.all(document.getAnimations().filter(a => a instanceof CSSTransition)
      .map(a => a.finished.catch(() => {})))
    const events: { post: string, type: string, paused: boolean, moving: boolean, time: number }[] = []
    const root = document.documentElement
    root.dataset.motionAudit = '[]'
    const record = (event: Event) => {
      const target = event.target as HTMLElement
      const card = target.closest<HTMLElement>('.masonry-item')
      if (!card) return
      const media = card.querySelector('video')
      if (!media) return
      if (event instanceof TransitionEvent && (target !== card || event.propertyName !== 'transform')) return
      const moving = card.getAnimations().some(a => a instanceof CSSTransition
        && a.transitionProperty === 'transform' && a.playState !== 'finished' && a.playState !== 'idle')
      events.push({ post: card.dataset.postId!, type: event.type, paused: media.paused, moving, time: performance.now() })
      root.dataset.motionAudit = JSON.stringify(events)
    }
    for (const type of ['transitionstart', 'transitionend', 'transitioncancel', 'playing', 'pause']) {
      document.addEventListener(type, record, true)
    }
  })
}

async function records(page: Page) {
  return page.evaluate(() => JSON.parse(document.documentElement.dataset.motionAudit ?? '[]') as
    { post: string, type: string, paused: boolean, moving: boolean, time: number }[])
}

for (const width of [1440, 390]) {
  test(`default demo holds each video until its own entrance ends at ${width}px`, async ({ page }, testInfo) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.setViewportSize({ width, height: 960 })
    await page.goto('/')
    await auditMotion(page)
    await page.locator('[data-test=filter-video]').click()
    await expect(page.locator('[data-test=showcase-stage]')).toHaveAttribute('data-loading', 'false')
    await expect.poll(async () => (await records(page)).filter(e => e.post.includes('-video-') && e.type === 'playing').length).toBeGreaterThan(0)
    await page.evaluate(async () => {
      await Promise.all(document.getAnimations().filter(a => a instanceof CSSTransition)
        .map(a => a.finished.catch(() => {})))
    })
    const events = (await records(page)).filter(e => e.post.includes('-video-'))
    await testInfo.attach('motion-events', { body: JSON.stringify(events, null, 2), contentType: 'application/json' })
    const starts = events.filter(e => e.type === 'transitionstart')
    expect(starts.length).toBeGreaterThan(0)
    expect(starts.filter(e => !e.paused)).toEqual([])
    expect(events.filter(e => e.type === 'playing' && e.moving)).toEqual([])
    // Animation.finished can resolve before transitionend is dispatched. The
    // native animation state at playing, checked above, is the playback boundary.
    const screenshotDir = process.env.VIBE_SITE_REVIEW_DIR
    if (screenshotDir) await page.screenshot({ path: `${screenshotDir}/per-card-default-${width}.png` })
    expect(errors).toEqual([])
  })
}

test('default demo pauses outgoing videos and survives an interrupted collection change', async ({ page }) => {
  await page.goto('/')
  await page.locator('[data-test=filter-video]').click()
  await expect(page.locator('[data-test=showcase-stage]')).toHaveAttribute('data-loading', 'false')
  await expect.poll(() => page.locator('.masonry-item video').evaluateAll(videos => videos.filter(v => !(v as HTMLVideoElement).paused).length)).toBeGreaterThan(0)
  await auditMotion(page)
  await page.locator('[data-test=filter-image]').click()
  await expect(page.locator('[data-test=showcase-stage]')).toHaveAttribute('data-loading', 'false')
  const exit = (await records(page)).filter(e => e.post.includes('-video-') && e.type === 'transitionstart')
  expect(exit.length).toBeGreaterThan(0)
  expect(exit.filter(e => !e.paused)).toEqual([])
  await expect(page.locator('.masonry-item video')).toHaveCount(0)
  await page.locator('[data-test=filter-video]').click()
  await expect(page.locator('.masonry-item video').first()).toBeAttached()
  await page.locator('[data-test=filter-image]').click()
  await expect(page.locator('[data-test=showcase-stage]')).toHaveAttribute('data-loading', 'false')
  await expect(page.locator('.masonry-item video')).toHaveCount(0)
  await page.locator('[data-test=filter-video]').click()
  await expect.poll(() => page.locator('.masonry-item video').evaluateAll(videos => videos.filter(v => !(v as HTMLVideoElement).paused).length)).toBeGreaterThan(0)
})

test('default demo reduced motion starts eligible videos without a missing-transition wait', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await page.locator('[data-test=filter-video]').click()
  await expect(page.locator('[data-test=showcase-stage]')).toHaveAttribute('data-loading', 'false')
  await expect.poll(() => page.locator('.masonry-item video').evaluateAll(videos => videos.filter(v => !(v as HTMLVideoElement).paused).length)).toBeGreaterThan(0)
  expect(await page.locator('.masonry-item').first().evaluate(el => Number.parseFloat(getComputedStyle(el).transitionDuration))).toBeLessThanOrEqual(0.001)
})
