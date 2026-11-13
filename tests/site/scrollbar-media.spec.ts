import { expect, test } from '@playwright/test'
import { capture, ready } from './showcaseSupport'

for (const reducedMotion of ['no-preference', 'reduce'] as const) {
  test(`defers masonry MP4 requests during a held scrollbar drag with motion ${reducedMotion}`, async ({ page }) => {
    test.setTimeout(90_000)
    await page.emulateMedia({ reducedMotion })
    const network = await page.context().newCDPSession(page)
    await network.send('Network.enable')
    await network.send('Network.setCacheDisabled', { cacheDisabled: true })
    await ready(page)
    const feed = page.locator('.masonry-feed')
    const loaded = page.locator('[data-test=loaded-count]')
    for (let count = 36; count <= 198; count += 18) {
      await feed.evaluate(element => { element.scrollTop = element.scrollHeight })
      await expect(loaded).toHaveText(String(count))
    }
    await feed.evaluate(element => { element.scrollTop = 0 })
    const thumb = page.getByRole('scrollbar', { name: 'Media gallery scroll position' })
    await expect(thumb).toHaveAttribute('aria-valuenow', '0')
    await expect.poll(() => feed.locator('video').first().evaluate(video => video.readyState)).toBeGreaterThan(0)
    const track = (await page.locator('.gallery-scrollbar').boundingBox())!
    const handle = (await thumb.boundingBox())!
    const x = handle.x + handle.width / 2
    const y = handle.y + handle.height / 2
    const travel = track.height - handle.height
    const requests: string[] = []
    page.on('request', request => {
      if (new URL(request.url()).pathname.endsWith('.mp4')) requests.push(request.url())
    })

    await page.mouse.move(x, y)
    await page.mouse.down()
    try {
      for (const position of [0.2, 0.75, 0.35, 0.6]) {
        await page.mouse.move(x, y + travel * position, { steps: 6 })
        await page.evaluate(async () => {
          for (let frame = 0; frame < 4; frame++) await new Promise(requestAnimationFrame)
        })
      }
      await expect(page.locator('.gallery-scrollbar')).toHaveClass(/gallery-scrollbar--dragging/)
      expect(Number(await thumb.getAttribute('aria-valuenow'))).toBeGreaterThan(0)
      await expect(feed.locator('video[src]')).toHaveCount(0)
      await capture(page, `scrollbar-media-held-${reducedMotion}`)
      expect(requests).toEqual([])
    } finally {
      await page.mouse.up()
    }

    await expect(page.locator('.gallery-scrollbar')).not.toHaveClass(/gallery-scrollbar--dragging/)
    await expect.poll(() => feed.locator('video[src]').count()).toBeGreaterThan(0)
    const landing = await feed.evaluate(element => {
      const bounds = element.getBoundingClientRect()
      const visible = (video: HTMLVideoElement) => {
        const card = video.closest('.masonry-item')!.getBoundingClientRect()
        return card.top < bounds.bottom && card.bottom > bounds.top
      }
      const videos = [...element.querySelectorAll<HTMLVideoElement>('video[src]')]
      return { visible: videos.filter(visible).map(video => video.src), overscan: videos.filter(video => !visible(video)).length }
    })
    expect(landing.overscan).toBe(0)
    await expect.poll(() => [...new Set(requests)].sort()).toEqual([...new Set(landing.visible)].sort())
    await expect.poll(() => feed.locator('video[src]').evaluateAll(videos =>
      videos.every(video => (video as HTMLVideoElement).readyState >= HTMLMediaElement.HAVE_CURRENT_DATA),
    )).toBe(true)
    expect(requests.filter(url => !landing.visible.includes(url))).toEqual([])
    console.log(JSON.stringify({ loaded: 198, dragRequests: 0, landingVideos: landing.visible.length, landingRequests: requests.length }))
    await capture(page, `scrollbar-media-released-${reducedMotion}`)
  })
}
