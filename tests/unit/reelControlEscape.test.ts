import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createVibe, type VibeInstance } from '@/index'

describe('Escape from focused reel controls', () => {
  let target: HTMLDivElement
  let instance: VibeInstance | undefined

  beforeEach(() => {
    target = document.createElement('div')
    document.body.append(target)
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      callback(0)
      return 1
    }))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(500)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(500)
  })

  afterEach(() => {
    instance?.destroy()
    target.remove()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it.each([
    '.media-control-seek',
    '.media-control-volume',
    '.media-control-playback',
    '.media-controls-audio button',
  ])('returns to the feed with %s focused', async (selector) => {
    instance = createVibe({
      target,
      initialPage: {
        items: [{
          postId: 1,
          src: 'https://example.test/video.mp4',
          width: 900,
          height: 1200,
          items: [],
        }],
        next: null,
      },
    })
    await instance.mount()
    await flushPromises()
    const card = target.querySelector<HTMLElement>('[data-post-id="1"]')!
    card.dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }))
    await flushPromises()
    expect(instance.getState().reelOrigin).toBe('masonry')

    const overlay = target.querySelector<HTMLElement>('.vibe-reel-overlay')!
    const video = overlay.querySelector('video')!
    Object.defineProperty(video, 'duration', { configurable: true, value: 120 })
    video.dispatchEvent(new Event('loadedmetadata'))
    await flushPromises()
    const control = overlay.querySelector<HTMLElement>(selector)!
    control.focus()
    expect(document.activeElement).toBe(control)

    const arrow = new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowRight' })
    const received = vi.fn()
    window.addEventListener('keydown', received)
    try {
      control.dispatchEvent(arrow)
      expect(received).not.toHaveBeenCalled()
      control.dispatchEvent(new KeyboardEvent('keydown', {
        bubbles: true, cancelable: true, key: 'Escape',
      }))
    }
    finally {
      window.removeEventListener('keydown', received)
    }
    await flushPromises()
    expect(instance.getState().reelOrigin).toBeNull()
    expect(target.querySelector('.vibe-reel-overlay')).toBeNull()
    expect(document.activeElement).toBe(card)
  })
})
