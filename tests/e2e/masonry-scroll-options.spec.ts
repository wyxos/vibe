import { expect, test } from '@playwright/test'

test('bottom space extends scrolling without moving cards and per-feed thresholds honor zero', async ({ page }) => {
  await page.goto('/demos/masonry-scroll-options')
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
