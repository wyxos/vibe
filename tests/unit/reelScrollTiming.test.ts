import { afterEach, expect, it, vi } from 'vitest'
import { transitionReelScroll } from '@/core/reelScrollTransition'

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

it.each([60, 165, 240])('uses elapsed time at %i Hz rather than assuming 60 frames per second', async rate => {
  const frames: FrameRequestCallback[] = []
  vi.spyOn(performance, 'now').mockReturnValue(0)
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { frames.push(callback); return frames.length })
  const element = document.createElement('div')
  const finished = transitionReelScroll(element, () => 500, false)
  for (let frame = 1; frame / rate * 1000 < 150 && frames.length; frame++) frames.shift()!(frame / rate * 1000)
  expect(element.hasAttribute('data-transitioning')).toBe(true)
  expect(element.scrollTop).toBeLessThan(450)
  while (frames.length) {
    // Deliver a final frame on the same monotonic clock as the animation start.
    frames.shift()!(300)
  }
  await finished
  expect(element.scrollTop).toBe(500)
  expect(element.hasAttribute('data-transitioning')).toBe(false)
})
