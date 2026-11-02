import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createVibe, type VibeInstance, type VibeItem } from '@/index'

function image(postId: number): VibeItem {
  return { postId, src: `https://example.test/image-${postId}.jpg`, width: 300, height: 400, items: [] }
}

function video(postId: number): VibeItem {
  return { postId, src: `https://example.test/video-${postId}.mp4`, type: 'video', width: 640, height: 480, items: [] }
}

describe('opt-in prepared page replacement', () => {
  let target: HTMLDivElement
  let instance: VibeInstance | undefined

  beforeEach(() => {
    target = document.createElement('div')
    document.body.append(target)
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(800)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(600)
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => undefined)
  })

  afterEach(() => {
    instance?.destroy()
    target.remove()
    vi.restoreAllMocks()
  })

  async function mount(onMediaReady = vi.fn()) {
    instance = createVibe({ target, infiniteScroll: false, onMediaReady,
      initialPage: { items: [image(1), image(2)], current: 'old', next: null } })
    await instance.mount()
    await flushPromises()
    let finish!: () => void
    const finished = new Promise<void>((resolve) => { finish = resolve })
    Object.defineProperty(target.querySelector('[data-post-id="1"]'), 'getAnimations', {
      configurable: true, value: () => [{ finished }],
    })
    return { vibe: instance, finish }
  }

  it('prepares a paused hidden video during exits and promotes the same native element', async () => {
    const onReady = vi.fn(() => instance!.getState().items.map((item) => item.postId))
    const { vibe, finish } = await mount(onReady)
    const options = { resetScroll: true, prepareMedia: true }
    const replacing = vibe.replacePage({ items: [video(3)], current: 'new', next: null }, options)
    await flushPromises()
    expect(vibe.getState().items.map((item) => item.postId)).toEqual([1, 2])
    const staged = target.querySelector<HTMLElement>('[data-post-id="3"]')!
    expect(staged).not.toBeNull()
    expect(staged.classList.contains('media-card--preparing')).toBe(true)
    expect(staged.getAttribute('aria-hidden')).toBe('true')
    expect(staged.hasAttribute('inert')).toBe(true)
    const media = staged.querySelector('video')!
    expect(media).not.toBeNull()
    expect(media.autoplay).toBe(false)
    expect(media.paused).toBe(true)
    expect(media.preload).toBe('auto')
    expect(vi.mocked(HTMLMediaElement.prototype.play).mock.contexts).not.toContain(media)
    const setSource = vi.spyOn(media, 'src', 'set')
    const load = vi.spyOn(media, 'load')
    Object.defineProperty(media, 'duration', { configurable: true, value: 12 })
    media.dispatchEvent(new Event('loadedmetadata'))
    await flushPromises()
    expect(onReady).not.toHaveBeenCalled()
    finish()
    await replacing
    await flushPromises()
    expect(vibe.getState().items.map((item) => item.postId)).toEqual([3])
    expect(target.querySelector('[data-post-id="3"] video')).toBe(media)
    expect(target.querySelector('[data-post-id="3"]')!.classList.contains('media-card--preparing')).toBe(false)
    expect(target.querySelector('[data-post-id="3"]')!.hasAttribute('inert')).toBe(false)
    expect(onReady).toHaveBeenCalledOnce()
    expect(onReady.mock.results[0]!.value).toEqual([3])
    expect(setSource).not.toHaveBeenCalled()
    expect(load).not.toHaveBeenCalled()
  })

  it('keeps the default replacement free of staged incoming media', async () => {
    const { vibe, finish } = await mount()
    const replacing = vibe.replacePage({ items: [video(3)], next: null }, { resetScroll: true })
    await flushPromises()
    expect(target.querySelector('[data-post-id="3"]')).toBeNull()
    expect(target.querySelector('.media-card--preparing')).toBeNull()
    finish()
    await replacing
    await flushPromises()
    expect(target.querySelector('[data-post-id="3"] video')).not.toBeNull()
  })

  it('cancels preparation without committing buffered readiness or incoming items', async () => {
    const onReady = vi.fn()
    const { vibe } = await mount(onReady)
    const options = { prepareMedia: true }
    const replacing = vibe.replacePage({ items: [video(3)], next: null }, options)
    await flushPromises()
    const media = target.querySelector<HTMLVideoElement>('[data-post-id="3"] video')!
    expect(media).not.toBeNull()
    media.dispatchEvent(new Event('loadedmetadata'))
    await flushPromises()
    await vibe.cancelLoading()
    await replacing
    await flushPromises()
    expect(vibe.getState().items.map((item) => item.postId)).toEqual([1, 2])
    expect(target.querySelector('[data-post-id="3"]')).toBeNull()
    expect(media.getAttribute('src')).toBeNull()
    expect(vi.mocked(HTMLMediaElement.prototype.load).mock.contexts).toContain(media)
    expect(onReady).not.toHaveBeenCalled()
  })

  it('discards a superseded preparation and commits only the latest generation', async () => {
    const { vibe, finish } = await mount()
    const options = { prepareMedia: true }
    const old = vibe.replacePage({ items: [video(3)], current: 'stale', next: null }, options)
    await flushPromises()
    const staleMedia = target.querySelector('[data-post-id="3"] video')
    expect(staleMedia).not.toBeNull()
    const latest = vibe.replacePage({ items: [video(4)], current: 'latest', next: null }, options)
    await flushPromises()
    expect(target.querySelector('[data-post-id="3"]')).toBeNull()
    const latestMedia = target.querySelector('[data-post-id="4"] video')
    expect(latestMedia).not.toBeNull()
    finish()
    await Promise.all([old, latest])
    await flushPromises()
    expect(vibe.getState().items.map((item) => item.postId)).toEqual([4])
    expect(vibe.getState().current).toBe('latest')
    expect(target.querySelector('[data-post-id="4"] video')).toBe(latestMedia)
    expect(staleMedia!.isConnected).toBe(false)
  })

  it('prepares only a bounded mounted subset of a larger incoming page', async () => {
    const { vibe, finish } = await mount()
    const options = { resetScroll: true, prepareMedia: true }
    const items = Array.from({ length: 80 }, (_, index) => video(index + 3))
    const replacing = vibe.replacePage({ items, next: null }, options)
    await flushPromises()
    const staged = [...target.querySelectorAll<HTMLVideoElement>('.media-card--preparing video')]
    const preparedByPost = new Map(staged.map((media) => [
      media.closest<HTMLElement>('[data-post-id]')!.dataset.postId!, media,
    ]))
    expect(staged.length).toBeGreaterThan(0)
    expect(staged.length).toBeLessThan(items.length)
    for (const media of staged) {
      expect(media.autoplay).toBe(false)
      expect(vi.mocked(HTMLMediaElement.prototype.play).mock.contexts).not.toContain(media)
    }
    finish()
    await replacing
    await flushPromises()
    expect(vibe.getState().items).toHaveLength(items.length)
    const promoted = [...target.querySelectorAll<HTMLVideoElement>('.masonry-item:not(.media-card--preparing) video')]
    expect(promoted.length).toBeGreaterThan(0)
    for (const media of promoted) {
      const id = media.closest<HTMLElement>('[data-post-id]')!.dataset.postId!
      if (preparedByPost.has(id)) expect(media).toBe(preparedByPost.get(id))
    }
  })

  it('resolves pending preparation on destroy without committing buffered events', async () => {
    const onReady = vi.fn()
    const { vibe } = await mount(onReady)
    const options = { prepareMedia: true }
    const replacing = vibe.replacePage({ items: [video(3)], next: null }, options)
    await flushPromises()
    const media = target.querySelector<HTMLVideoElement>('[data-post-id="3"] video')!
    expect(media).not.toBeNull()
    media.dispatchEvent(new Event('loadedmetadata'))
    await flushPromises()
    vibe.destroy()
    await replacing
    await flushPromises()
    expect(media.isConnected).toBe(false)
    expect(onReady).not.toHaveBeenCalled()
    expect(vibe.getState().items.map((item) => item.postId)).toEqual([1, 2])
  })
})
