import { afterEach, describe, expect, it, vi } from 'vitest'
import { transitionReelScroll } from '@/core/reelScrollTransition'

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

describe('shared reel scroll transition', () => {
  it('cancels an animation frame on abort without overwriting a newer scroll position', async () => {
    const frames: FrameRequestCallback[] = []
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      frames.push(callback)
      return frames.length
    }))
    const cancel = vi.fn()
    vi.stubGlobal('cancelAnimationFrame', cancel)
    const element = document.createElement('div')
    const controller = new AbortController()
    const transition = transitionReelScroll(element, 600, false, controller.signal)
    frames[0]?.(performance.now() + 100)
    expect(element.scrollTop).toBeGreaterThan(0)
    expect(element.scrollTop).toBeLessThan(600)
    controller.abort()
    await transition
    element.scrollTop = 1200
    expect(cancel).toHaveBeenCalledWith(2)
    expect(element.hasAttribute('data-transitioning')).toBe(false)
    expect(element.scrollTop).toBe(1200)
  })

  it('moves immediately with reduced motion and leaves an already aborted viewport alone', async () => {
    const element = document.createElement('div')
    await transitionReelScroll(element, 600, true)
    expect(element.scrollTop).toBe(600)
    await transitionReelScroll(element, 1200, false, AbortSignal.abort())
    expect(element.scrollTop).toBe(600)
    expect(element.hasAttribute('data-transitioning')).toBe(false)
  })
})
