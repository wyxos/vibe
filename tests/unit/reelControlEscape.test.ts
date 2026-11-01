import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createVibe, type VibeInstance } from '@/index'

describe('Escape from focused reel controls', () => {
  let target: HTMLDivElement
  let instance: VibeInstance | undefined

  beforeEach(() => {
    target = document.createElement('div')
    document.body.append(target)
    let frameTime = performance.now()
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      callback(frameTime += 1000 / 60)
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

  it('leaves a feed-opened reel mounted when a nested control has handled Escape', async () => {
    instance = createVibe({ target, initialPage: { items: [{ postId: 1,
      src: 'https://example.test/image.jpg', width: 400, height: 600, items: [] }], next: null } })
    await instance.mount()
    await flushPromises()
    target.querySelector<HTMLElement>('[data-post-id="1"]')!
      .dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }))
    await flushPromises()
    const overlay = target.querySelector<HTMLElement>('.vibe-reel-overlay')!
    const escape = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Escape' })
    escape.preventDefault()
    overlay.dispatchEvent(escape)
    await flushPromises()
    expect(instance.getState().reelOrigin).toBe('masonry')
    expect(target.querySelector('.vibe-reel-overlay')).not.toBeNull()
  })

  it('lets a focused host dialog outside the feed own Escape', async () => {
    instance = createVibe({ target, initialPage: { items: [{ postId: 1,
      src: 'https://example.test/image.jpg', width: 400, height: 600, items: [] }], next: null } })
    await instance.mount()
    await flushPromises()
    target.querySelector<HTMLElement>('[data-post-id="1"]')!
      .dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }))
    await flushPromises()
    const dialog = document.createElement('div')
    dialog.setAttribute('role', 'dialog')
    dialog.setAttribute('aria-modal', 'true')
    const control = document.createElement('button')
    dialog.append(control)
    document.body.append(dialog)
    try {
      control.focus()
      const escape = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Escape' })
      control.dispatchEvent(escape)
      await flushPromises()
      expect(escape.defaultPrevented).toBe(false)
      expect(instance.getState().reelOrigin).toBe('masonry')
    } finally { dialog.remove() }
  })

  it('lets the focused viewer own Escape over an unrelated later mounted reel', async () => {
    const items = [{ postId: 1, src: 'https://example.test/image.jpg', width: 400, height: 600, items: [] }]
    instance = createVibe({ target, initialPage: { items, next: null } })
    await instance.mount()
    await flushPromises()
    target.querySelector<HTMLElement>('[data-post-id="1"]')!
      .dispatchEvent(new MouseEvent('click', { bubbles: true, detail: 1 }))
    await flushPromises()
    const otherTarget = document.createElement('div')
    document.body.append(otherTarget)
    const other = createVibe({ target: otherTarget, layout: 'reel', initialPage: { items, next: null } })
    try {
      await other.mount()
      await flushPromises()
      const overlay = target.querySelector<HTMLElement>('.vibe-reel-overlay')!
      overlay.focus()
      const escape = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Escape' })
      overlay.dispatchEvent(escape)
      await flushPromises()
      expect(escape.defaultPrevented).toBe(true)
      expect(instance.getState().reelOrigin).toBeNull()
      expect(other.getState().layout).toBe('reel')
    } finally { other.destroy(); otherTarget.remove() }
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
