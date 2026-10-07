import { expect, test } from '@playwright/test'

test('bottom space extends scrolling without moving cards and per-feed thresholds honor zero', async ({ page }) => {
  await page.goto('/demos/item-removal')
  await page.evaluate(async () => {
    const modulePath = '/src/index.ts'
    const { createVibe } = await import(/* @vite-ignore */ modulePath)
    const fixture = document.createElement('div')
    fixture.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#111;display:grid;grid-template-columns:300px 300px;gap:12px;overflow:auto;align-content:start'
    document.body.append(fixture)
    const items = Array.from({ length: 8 }, (_, index) => ({ postId: index, mediaId: index,
      src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="250"/>',
      width: 300, height: 250, items: [] }))
    for (const [name, options] of Object.entries({ baseline: {}, padded: { bottomSpacePx: 200 },
      early: { bottomSpacePx: 200, loadMoreThresholdPx: 100 }, exact: { bottomSpacePx: 200, loadMoreThresholdPx: 0 } })) {
      const target = document.createElement('div')
      target.id = name; target.style.cssText = 'height:300px;width:300px'
      target.dataset.requests = '0'; fixture.append(target)
      const vibe = createVibe({ target, layout: 'masonry', masonry: { minColumnWidth: 500, ...options },
        initialPage: { items, next: 'next' }, loadPage: async () => {
          target.dataset.requests = String(Number(target.dataset.requests) + 1)
          return { items: [], next: null }
        } })
      await vibe.mount()
    }
  })
  await expect(page.locator('#padded .masonry-item').first()).toBeVisible()
  const metrics = await page.evaluate(() => ['baseline', 'padded'].map(id => {
    const feed = document.querySelector<HTMLElement>(`#${id} .masonry-feed`)!
    const cards = [...feed.querySelectorAll<HTMLElement>('article')]
    return { scrollHeight: feed.scrollHeight, cards: cards.map(card => [card.style.transform, card.style.width, card.style.height]) }
  }))
  expect(metrics[1]!.scrollHeight - metrics[0]!.scrollHeight).toBe(200)
  expect(metrics[1]!.cards).toEqual(metrics[0]!.cards)
  for (const [id, threshold] of [['early', 100], ['exact', 0]] as const) {
    const scrollRemaining = async (remaining: number) => page.locator(`#${id} .masonry-feed`).evaluate(async (element, value) => {
      element.scrollTop = element.scrollHeight - element.clientHeight - value
      element.dispatchEvent(new Event('scroll'))
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
    }, remaining)
    await scrollRemaining(threshold + 1)
    await expect(page.locator(`#${id}`)).toHaveAttribute('data-requests', '0')
    await scrollRemaining(threshold)
    await expect(page.locator(`#${id}`)).toHaveAttribute('data-requests', '1')
  }
  await expect(page.locator('#baseline')).toHaveAttribute('data-requests', '0')
  await expect(page.locator('#padded')).toHaveAttribute('data-requests', '0')
})
