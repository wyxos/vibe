import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

const { probeVibeAssetUrlMock, resolveVibeAssetErrorKindMock } = vi.hoisted(() => ({
  probeVibeAssetUrlMock: vi.fn(async () => null as const),
  resolveVibeAssetErrorKindMock: vi.fn(async () => 'generic' as const),
}))

vi.mock('@/components/viewer-core/loadError', () => ({
  canRetryVibeAssetError(kind: 'generic' | 'not-found' | null | undefined) {
    return kind === 'generic'
  },
  getVibeAssetErrorLabel(kind: 'generic' | 'not-found') {
    return kind === 'not-found' ? '404' : 'Load error'
  },
  probeVibeAssetUrl: probeVibeAssetUrlMock,
  resolveVibeAssetErrorKind: resolveVibeAssetErrorKindMock,
}))

import Layout from '@/components/Layout.vue'
import { createSeededVibeProps } from '../helpers/createSeededVibeProps'
import { createAudioItem, createImageItem, createVideoItem, flushDom, setViewportHeight, setViewportWidth } from '../helpers/vibeTestUtils'

const DEFAULT_VIEWPORT_WIDTH = window.innerWidth
const DEFAULT_VIEWPORT_HEIGHT = window.innerHeight

describe('VibeLayout media', () => {
  afterEach(() => {
    setViewportWidth(DEFAULT_VIEWPORT_WIDTH)
    setViewportHeight(DEFAULT_VIEWPORT_HEIGHT)
    probeVibeAssetUrlMock.mockReset()
    probeVibeAssetUrlMock.mockResolvedValue(null)
    resolveVibeAssetErrorKindMock.mockReset()
    resolveVibeAssetErrorKindMock.mockResolvedValue('generic')
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('forces fullscreen on mobile and hides the title when the active item has no title', async () => {
    setViewportWidth(390)

    const item = createImageItem('image-3', undefined)
    const wrapper = mount(Layout, {
      props: createSeededVibeProps([item]),
    })

    await flushDom()

    expect(wrapper.get('[data-testid="vibe"]').attributes('data-surface-mode')).toBe('fullscreen')
    expect(wrapper.find('[data-testid="vibe-title"]').exists()).toBe(false)
    expect(wrapper.get('img').attributes('src')).toBe(item.url)

    wrapper.unmount()
  })

  it('shows an image spinner until the active image finishes loading', async () => {
    setViewportWidth(390)

    const wrapper = mount(Layout, {
      props: createSeededVibeProps([createImageItem('image-4', 'Image loading')]),
    })

    await flushDom()

    expect(wrapper.get('[data-testid="vibe-asset-spinner"]').exists()).toBe(true)
    expect(wrapper.get('img').classes()).toContain('opacity-0')

    await wrapper.get('img').trigger('load')
    await flushDom()

    expect(wrapper.find('[data-testid="vibe-asset-spinner"]').exists()).toBe(false)
    expect(wrapper.get('img').classes()).toContain('opacity-100')

    wrapper.unmount()
  })

  it('preloads forward fullscreen images so the swipe path stays warm', async () => {
    setViewportWidth(390)

    const wrapper = mount(Layout, {
      props: createSeededVibeProps([
        createImageItem('image-preload-1', 'Image 1'),
        createImageItem('image-preload-2', 'Image 2'),
        createImageItem('image-preload-3', 'Image 3'),
        createImageItem('image-preload-4', 'Image 4'),
        createImageItem('image-preload-5', 'Image 5'),
        createImageItem('image-preload-6', 'Image 6'),
      ], {
        activeIndex: 0,
      }),
    })

    await flushDom()

    expect(wrapper.get('[data-index="0"] img').attributes('src')).toBe('https://example.com/image-preload-1.jpg')
    expect(wrapper.get('[data-index="1"] img').attributes('src')).toBe('https://example.com/image-preload-2.jpg')
    expect(wrapper.get('[data-index="2"] img').attributes('src')).toBe('https://example.com/image-preload-3.jpg')
    expect(wrapper.get('[data-index="3"] img').attributes('src')).toBe('https://example.com/image-preload-4.jpg')

    await wrapper.get('[data-index="1"] img').trigger('load')
    await flushDom()

    expect(wrapper.get('[data-index="3"] img').attributes('src')).toBe('https://example.com/image-preload-4.jpg')

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    await flushDom()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    await flushDom()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    await flushDom()

    expect(wrapper.find('[data-index="1"] img').exists()).toBe(false)
    expect(wrapper.get('[data-index="3"] img').attributes('src')).toBe('https://example.com/image-preload-4.jpg')
    expect(wrapper.get('[data-index="4"] img').attributes('src')).toBe('https://example.com/image-preload-5.jpg')
    expect(wrapper.get('[data-index="5"] img').attributes('src')).toBe('https://example.com/image-preload-6.jpg')

    wrapper.unmount()
  })

  it('keeps the spinner on a promoted loading fullscreen image while the forward preload window advances', async () => {
    setViewportWidth(390)

    const wrapper = mount(Layout, {
      props: createSeededVibeProps([
        createImageItem('image-pending-1', 'Image 1'),
        createImageItem('image-pending-2', 'Image 2'),
        createImageItem('image-pending-3', 'Image 3'),
        createImageItem('image-pending-4', 'Image 4'),
        createImageItem('image-pending-5', 'Image 5'),
        createImageItem('image-pending-6', 'Image 6'),
      ], {
        activeIndex: 0,
      }),
    })

    await flushDom()

    expect(wrapper.get('[data-index="1"] img').attributes('src')).toBe('https://example.com/image-pending-2.jpg')
    expect(wrapper.get('[data-index="2"] img').attributes('src')).toBe('https://example.com/image-pending-3.jpg')
    expect(wrapper.get('[data-index="3"] img').attributes('src')).toBe('https://example.com/image-pending-4.jpg')

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    await flushDom()

    expect(wrapper.get('[data-testid="vibe-pagination"]').text()).toContain('2 / 6')
    expect(wrapper.get('[data-testid="vibe-asset-spinner"]').exists()).toBe(true)
    expect(wrapper.get('[data-index="1"] img').attributes('src')).toBe('https://example.com/image-pending-2.jpg')
    expect(wrapper.get('[data-index="2"] img').attributes('src')).toBe('https://example.com/image-pending-3.jpg')
    expect(wrapper.get('[data-index="3"] img').attributes('src')).toBe('https://example.com/image-pending-4.jpg')
    expect(wrapper.get('[data-index="4"] img').attributes('src')).toBe('https://example.com/image-pending-5.jpg')

    await wrapper.get('[data-index="1"] img').trigger('load')
    await flushDom()

    expect(wrapper.find('[data-testid="vibe-asset-spinner"]').exists()).toBe(false)

    wrapper.unmount()
  })

  it('reuses a preloaded fullscreen image when it becomes active', async () => {
    setViewportWidth(390)

    const wrapper = mount(Layout, {
      props: createSeededVibeProps([
        createImageItem('image-reuse-1', 'Image 1'),
        createImageItem('image-reuse-2', 'Image 2'),
        createImageItem('image-reuse-3', 'Image 3'),
      ], {
        activeIndex: 0,
      }),
    })

    await flushDom()
    await wrapper.get('[data-index="1"] img').trigger('load')
    await flushDom()
    await wrapper.get('[data-index="2"] img').trigger('load')
    await flushDom()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    await flushDom()
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    await flushDom()

    expect(wrapper.get('[data-testid="vibe-pagination"]').text()).toContain('3 / 3')
    expect(wrapper.find('[data-testid="vibe-asset-spinner"]').exists()).toBe(false)
    expect(wrapper.get('[data-index="2"] img').classes()).toContain('opacity-100')

    wrapper.unmount()
  })

  it('clears fullscreen image sources when exiting back to the list', async () => {
    setViewportWidth(1_280)

    const wrapper = mount(Layout, {
      props: createSeededVibeProps([
        createImageItem('image-exit-1', 'Image 1'),
        createImageItem('image-exit-2', 'Image 2'),
        createImageItem('image-exit-3', 'Image 3'),
      ]),
    })

    await flushDom()
    await wrapper.get('[data-index="0"] button').trigger('click')
    await flushDom()

    const fullscreenSurface = wrapper.get('[data-testid="vibe-fullscreen-surface"]')

    expect(fullscreenSurface.get('[data-index="0"] img').attributes('src')).toBe('https://example.com/image-exit-1.jpg')
    expect(fullscreenSurface.get('[data-index="1"] img').attributes('src')).toBe('https://example.com/image-exit-2.jpg')

    await wrapper.get('[data-testid="vibe-back-to-list"]').trigger('click')
    await flushDom()

    expect(fullscreenSurface.get('[data-index="0"] img').attributes('src')).toBeUndefined()
    expect(fullscreenSurface.get('[data-index="1"] img').attributes('src')).toBeUndefined()

    wrapper.unmount()
  })

  it('shows media spinners before video and audio are ready', async () => {
    setViewportWidth(390)

    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve())
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})

    const videoWrapper = mount(Layout, {
      props: createSeededVibeProps([createVideoItem('video-3', 'Video loading')]),
    })

    await flushDom()

    expect(videoWrapper.get('[data-testid="vibe-asset-spinner"]').exists()).toBe(true)
    expect(videoWrapper.get('video').classes()).toContain('opacity-0')

    videoWrapper.unmount()

    const audioWrapper = mount(Layout, {
      props: createSeededVibeProps([createAudioItem('audio-1', 'Audio loading')]),
    })

    await flushDom()

    expect(audioWrapper.get('[data-testid="vibe-asset-spinner"]').exists()).toBe(true)
    audioWrapper.unmount()
  })

  it('enables audio and loops fullscreen video by default', async () => {
    setViewportWidth(390)

    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve())
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})

    const wrapper = mount(Layout, {
      props: createSeededVibeProps([createVideoItem('video-loop-default', 'Loop default')]),
    })

    await flushDom()

    expect((wrapper.get('video').element as HTMLVideoElement).muted).toBe(false)
    expect((wrapper.get('video').element as HTMLVideoElement).loop).toBe(true)

    wrapper.unmount()
  })

  it('lets consumers disable fullscreen video looping', async () => {
    setViewportWidth(390)

    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve())
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})

    const wrapper = mount(Layout, {
      props: createSeededVibeProps([createVideoItem('video-loop-off', 'Loop disabled')], {
        loopFullscreenVideo: false,
      }),
    })

    await flushDom()

    expect((wrapper.get('video').element as HTMLVideoElement).loop).toBe(false)

    wrapper.unmount()
  })

  it('renders a 404 state for a fullscreen image load failure', async () => {
    setViewportWidth(390)
    resolveVibeAssetErrorKindMock.mockResolvedValueOnce('not-found')
    const wrapper = mount(Layout, {
      props: createSeededVibeProps([createImageItem('image-404', 'Missing image')]),
    })

    await flushDom()
    await wrapper.get('img').trigger('error')
    await flushDom()
    expect(wrapper.get('[data-testid="vibe-asset-error"]').attributes('data-kind')).toBe('not-found')
    expect(wrapper.text()).toContain('404')
    expect(wrapper.find('[data-testid="vibe-asset-spinner"]').exists()).toBe(false)

    wrapper.unmount()
  })
  it('renders a generic error state for a fullscreen audio load failure and hides the media bar', async () => {
    setViewportWidth(390)
    resolveVibeAssetErrorKindMock.mockResolvedValueOnce('generic')

    const wrapper = mount(Layout, {
      props: createSeededVibeProps([createAudioItem('audio-broken', 'Broken audio')]),
    })

    await flushDom()
    await wrapper.get('audio').trigger('error')
    await flushDom()

    expect(wrapper.get('[data-testid="vibe-asset-error"]').attributes('data-kind')).toBe('generic')
    expect(wrapper.text()).toContain('Load error')
    expect(wrapper.find('[data-testid="vibe-media-bar"]').exists()).toBe(false)

    wrapper.unmount()
  })
  it('allows retrying a generic fullscreen image load failure', async () => {
    setViewportWidth(390)
    resolveVibeAssetErrorKindMock.mockResolvedValueOnce('generic')
    const wrapper = mount(Layout, {
      props: createSeededVibeProps([createImageItem('image-retry', 'Retry image')]),
    })
    await flushDom()
    await wrapper.get('img').trigger('error')
    await flushDom()
    expect(wrapper.get('[data-testid="vibe-asset-error"]').attributes('data-kind')).toBe('generic')
    expect(wrapper.text()).toContain('Retry')
    await wrapper.get('[data-testid="vibe-asset-error"] button').trigger('click')
    await flushDom()
    expect(wrapper.find('[data-testid="vibe-asset-error"]').exists()).toBe(false)
    expect(wrapper.get('img').attributes('src')).toBe('https://example.com/image-retry.jpg')
    expect(wrapper.get('[data-testid="vibe-asset-spinner"]').exists()).toBe(true)
    wrapper.unmount()
  })


})
