import { expect, test, type Locator } from '@playwright/test'
import { capture, ready } from './showcaseSupport'

async function sampleFirstCardResize(first: Locator) {
  return first.evaluate(async card => {
    const content = card.querySelector('.media-card-content')!
    const media = card.querySelector('.media-card-media')!
    const width = () => content.getBoundingClientRect().width
    const previewSize = () => {
      const { width, height } = media.getBoundingClientRect()
      return [width, height]
    }
    const before = width()
    const originalPreview = previewSize()
    document.querySelector<HTMLButtonElement>(`button[aria-label="List view"]`)!.click()
    const frame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
    await frame()
    const animations = [card, content, media].flatMap(element => element.getAnimations())
    const resize = media.getAnimations()[0]
    let previewStartsAtCurrentSize = false
    if (resize) {
      resize.pause()
      resize.currentTime = 0
      await resize.ready
      previewStartsAtCurrentSize = previewSize().every((value, index) => Math.abs(value - originalPreview[index]!) < 1)
      resize.play()
    }
    const finished = Promise.all(animations.map(animation => animation.finished.catch(() => {})))
    const widths = [width()]
    while (animations.some(animation => animation.playState === 'running')) {
      await frame()
      widths.push(width())
    }
    await finished
    const after = width()
    const low = Math.min(before, after)
    const high = Math.max(before, after)
    return { resized: high - low > 2, intermediate: widths.some(value => value > low + 1 && value < high - 1), previewStartsAtCurrentSize }
  })
}

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`first card resizes in both directions with motion ${reducedMotion}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 844 })
    await page.emulateMedia({ reducedMotion })
    await ready(page)
    const first = page.locator('.masonry-item').first()
    await expect(first).not.toHaveClass(/media-card--entering/)
    const animated = reducedMotion === 'no-preference'
    const expected = { resized: true, intermediate: animated, previewStartsAtCurrentSize: animated }
    expect(await sampleFirstCardResize(first)).toEqual(expected)
    expect(await sampleFirstCardResize(first)).toEqual(expected)
  })
}

test('cards dock before list rows expand and collapse before returning', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 844 })
  await ready(page)
  const second = page.locator('.masonry-item').nth(1)
  await expect(second).not.toHaveClass(/media-card--entering/)
  const result = await second.evaluate(async card => {
    const toggle = document.querySelector<HTMLButtonElement>('button[aria-label="List view"]')!
    const content = card.querySelector('.media-card-content')!
    const measure = () => {
      const { x, y, width } = content.getBoundingClientRect()
      return { x, y, width }
    }
    async function switchAt(fraction: number) {
      toggle.click()
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
      const animations = card.getAnimations({ subtree: true })
        .filter(animation => animation.effect instanceof KeyframeEffect && animation.effect.getKeyframes().length === 3)
      if (animations.length < 3) throw Error('Card layout animation missing')
      for (const animation of animations) {
        animation.pause()
        animation.currentTime = Number(animation.effect!.getTiming().duration) * fraction
      }
      await Promise.all(animations.map(animation => animation.ready))
      const middle = measure()
      animations.forEach(animation => animation.finish())
      await Promise.all(animations.map(animation => animation.finished))
      return { middle, end: measure() }
    }
    const masonry = measure()
    const list = await switchAt(0.6)
    const back = await switchAt(0.4)
    return { masonry, list, back }
  })
  expect(result.masonry.x).toBeGreaterThan(result.list.end.x + 10)
  expect(result.list.middle.x).toBeCloseTo(result.list.end.x, 0)
  expect(result.list.middle.y).toBeCloseTo(result.list.end.y, 0)
  expect(result.list.middle.width).toBeLessThan(result.list.end.width / 2)
  expect(result.back.middle.x).toBeCloseTo(result.list.end.x, 0)
  expect(result.back.middle.y).toBeCloseTo(result.list.end.y, 0)
  expect(result.back.middle.width).toBeCloseTo(result.list.middle.width, 0)
  expect(result.back.end.x).toBeCloseTo(result.masonry.x, 0)
})

for (const [width, reducedMotion] of [[1440, 'no-preference'], [390, 'reduce']] as const) {
  test(`switches feed layouts at ${width}px and returns from the reel to the list`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await page.emulateMedia({ reducedMotion })
    const errors = await ready(page)
    const toggle = page.getByRole('button', { name: 'List view' })
    const feed = page.locator('.masonry-feed')
    const rows = feed.locator('.masonry-item')
    const loaded = page.locator('[data-test=loaded-count]')
    const count = await loaded.textContent()
    const first = rows.first()
    const postId = await first.getAttribute('data-post-id')

    await expect(toggle).toHaveAttribute('aria-pressed', 'false')
    await toggle.focus()
    await toggle.press('Enter')
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await expect(toggle).toBeFocused()
    await expect(feed).toHaveAttribute('data-layout-mode', 'list')
    await expect(first).toHaveAttribute('data-post-id', postId!)
    await expect(loaded).toHaveText(count!)
    await expect.poll(async () => {
      const [one, two, thumbnail] = await Promise.all([
        first.boundingBox(), rows.nth(1).boundingBox(),
        first.locator('.media-card-media').boundingBox(),
      ])
      return Boolean(one && two && thumbnail
        && one.x === two.x && one.y + one.height < two.y
        && one.height === thumbnail.height && thumbnail.width === thumbnail.height)
    }).toBe(true)
    await capture(page, `vibe-list-${width}`)

    await first.locator('.media-card-activator').click()
    await expect(page.locator('.reel-feed')).toHaveAttribute('data-active-post-id', postId!)
    await page.getByRole('button', { name: 'Back to feed' }).click()
    await expect(page.locator('.vibe-reel-overlay')).toHaveCount(0)
    await expect(feed).toHaveAttribute('data-layout-mode', 'list')
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')

    await toggle.click()
    await expect(feed).toHaveAttribute('data-layout-mode', 'masonry')
    await expect(toggle).toHaveAttribute('aria-pressed', 'false')
    await expect(loaded).toHaveText(count!)
    await expect.poll(async () => {
      const [one, two] = await Promise.all([first.boundingBox(), rows.nth(1).boundingBox()])
      return Boolean(one && two && one.x < two.x && Math.abs(one.y - two.y) < 1)
    }).toBe(true)
    await capture(page, `vibe-masonry-${width}`)
    expect(errors).toEqual([])
  })
}
