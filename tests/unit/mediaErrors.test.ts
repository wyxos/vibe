import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createVibe, type VibeInstance, type VibeItem, type VibeMediaErrorContext } from '@/index'

const item = (): VibeItem => ({
  postId: 1, mediaId: 'asset', items: [], type: 'image',
  src: '/original.jpg', width: 400, height: 300,
  preview: { src: '/preview.jpg', width: 200, height: 150 },
  mobile: { src: '/mobile.jpg', width: 300, height: 225 },
})

describe('host media failure callback', () => {
  let target: HTMLDivElement
  let instance: VibeInstance | undefined
  beforeEach(() => {
    target = document.createElement('div')
    document.body.append(target)
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {})
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(500)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(500)
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => { callback(0); return 1 }))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
  })
  afterEach(() => {
    instance?.destroy()
    target.remove()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  async function mount(media = item(), layout: 'masonry' | 'reel' = 'masonry') {
    const callback = vi.fn<(context: VibeMediaErrorContext) => void>()
    instance = createVibe({ target, initialPage: { items: [media], next: null }, layout, onMediaError: callback })
    await instance.mount()
    await flushPromises()
    return callback
  }

  it('reports the attempted preview and stable media identity once per failed attempt', async () => {
    const callback = await mount()
    const image = target.querySelector('img')!
    image.dispatchEvent(new Event('error'))
    image.dispatchEvent(new Event('error'))
    expect(callback).toHaveBeenCalledOnce()
    expect(callback.mock.calls[0]?.[0]).toMatchObject({
      postId: 1, mediaId: 'asset', mediaIndex: 0, postIndex: 0,
      source: 'preview', src: '/preview.jpg', layout: 'masonry', origin: null,
    })
  })

  it.each(['original', 'mobile'] as const)('reports %s failures in reels', async (source) => {
    if (source === 'mobile') {
      vi.spyOn(window.screen, 'width', 'get').mockReturnValue(390)
      vi.spyOn(window.screen, 'height', 'get').mockReturnValue(844)
    }
    const callback = await mount(item(), 'reel')
    target.querySelector('img')!.dispatchEvent(new Event('error'))
    expect(callback.mock.calls[0]?.[0]).toMatchObject({ source, src: `/${source}.jpg`, layout: 'reel', origin: 'reel' })
  })

  it('reports original when a preview is absent and falls back to original', async () => {
    const media = item()
    delete media.preview
    const callback = await mount(media)
    target.querySelector('img')!.dispatchEvent(new Event('error'))
    expect(callback.mock.calls[0]?.[0]).toMatchObject({ source: 'original', src: '/original.jpg' })
  })

  it('ignores errors from replaced sources and retries a host update without replacing the feed', async () => {
    const callback = await mount()
    const previous = target.querySelector('img')!
    const updated = item()
    updated.preview!.src = '/preview.jpg?v=2'
    instance!.updateItems([updated])
    await flushPromises()
    previous.dispatchEvent(new Event('error'))
    expect(callback).not.toHaveBeenCalled()
    const current = target.querySelector('img')!
    expect(current.getAttribute('src')).toBe('/preview.jpg?v=2')
    current.dispatchEvent(new Event('error'))
    await flushPromises()
    expect(callback.mock.calls[0]?.[0].src).toBe('/preview.jpg?v=2')
    target.querySelector<HTMLButtonElement>('[data-test="media-retry"]')!.click()
    await flushPromises()
    target.querySelector('img')!.dispatchEvent(new Event('error'))
    expect(callback).toHaveBeenCalledTimes(2)
  })

  it('ignores stale artwork failures after a host replaces the cover', async () => {
    const media = item()
    media.type = 'audio'
    media.src = '/original.mp3'
    media.preview!.type = 'image'
    const callback = await mount(media)
    const previous = target.querySelector('.media-audio-cover')!
    instance!.updateItems([{ ...media, preview: { ...media.preview!, src: '/cover-v2.jpg' } }])
    await flushPromises()
    previous.dispatchEvent(new Event('error'))
    expect(callback).not.toHaveBeenCalled()
    target.querySelector('.media-audio-cover')!.dispatchEvent(new Event('error'))
    expect(callback.mock.calls[0]?.[0]).toMatchObject({ source: 'preview', src: '/cover-v2.jpg' })
  })

  it('reports artwork independently from original audio playback', async () => {
    const media = item()
    media.type = 'audio'
    media.src = '/original.mp3'
    media.preview!.type = 'image'
    const callback = await mount(media, 'reel')
    target.querySelector('.media-audio-cover')!.dispatchEvent(new Event('error'))
    expect(callback.mock.calls[0]?.[0]).toMatchObject({ source: 'preview', src: '/preview.jpg' })
    target.querySelector('audio')!.dispatchEvent(new Event('error'))
    expect(callback.mock.calls[1]?.[0]).toMatchObject({ source: 'original', src: '/original.mp3' })
  })
})
