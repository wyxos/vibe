import { expect, test } from '@playwright/test'
import { capture, ready } from './showcaseSupport'

for (const input of ['wheel', 'touch'] as const) {
  test.describe(input, () => {
    test.use(input === 'touch' ? { hasTouch: true, viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' } : {})

    test('pauses loaded media and defers new requests until the feed settles', async ({ page }) => {
      test.setTimeout(90_000)
      const client = await page.context().newCDPSession(page)
      await client.send('Network.enable')
      await client.send('Network.setCacheDisabled', { cacheDisabled: true })
      await ready(page)
      const feed = page.locator('.masonry-feed')
      for (let count = 36; count <= 198; count += 18) {
        await feed.evaluate(element => { element.scrollTop = element.scrollHeight })
        await expect(page.locator('[data-test=loaded-count]')).toHaveText(String(count))
      }
      await feed.evaluate(element => { element.scrollTop = 0 })
      const firstVideo = feed.locator('[data-post-id="showcase-orbit-all-1"] video')
      await expect.poll(() => firstVideo.evaluate(element => !element.paused && element.currentTime > 0)).toBe(true)
      const video = await firstVideo.elementHandle()
      await video.evaluate(element => {
        element.addEventListener('pause', () => {
          element.dataset.pausedWithFrame = String(element.isConnected
            && element.classList.contains('media-preview--ready')
            && element.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA)
        }, { once: true })
      })
      const bounds = (await feed.boundingBox())!
      const x = Math.round(bounds.x + bounds.width / 2)
      const y = Math.round(bounds.y + bounds.height * 0.8)
      const requests: string[] = []
      page.on('request', request => {
        if (['image', 'media'].includes(request.resourceType())) requests.push(request.url())
      })
      const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', offset = 0) =>
        client.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y: y - offset }] })
      const wheel = (delta: number) => page.mouse.wheel(0, delta)
      if (input === 'touch') {
        await touch('touchStart')
        await touch('touchMove', 35)
        await touch('touchMove', 65)
      } else {
        await page.mouse.move(x, y)
        await wheel(25)
      }
      try {
        await expect.poll(() => video.evaluate(element => element.dataset.pausedWithFrame), {
          intervals: [10, 20, 30], timeout: 1000,
        }).toBe('true')
        for (let step = 1; step <= 8; step++) {
          if (input === 'touch') await touch('touchMove', 65 + step * 55)
          else await wheel(180)
        }
        await expect.poll(() => feed.evaluate(element => element.scrollTop), { intervals: [10, 20] }).toBeGreaterThan(250)
        expect(requests).toEqual([])
      } finally {
        if (input === 'touch') await touch('touchEnd')
      }
      await expect.poll(() => requests.some(url => !url.endsWith('.mp4'))).toBe(true)
      await expect.poll(() => feed.locator('video').evaluateAll(videos => videos.some(node => {
        const video = node as HTMLVideoElement
        return !video.paused && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
      }))).toBe(true)
      await capture(page, `scroll-gesture-media-${input}-settled`)
      console.log(JSON.stringify({ input, loaded: 198, requestsWhileScrolling: 0, settledRequests: requests.length }))
    })
  })
}
