import { mount } from '@vue/test-utils'
import { h, nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'

import FullscreenSurface from '@/components/FullscreenSurface.vue'
import Layout from '@/components/Layout.vue'
import type { VibeViewerItem } from '@/components/viewer'
import type { VibeHandle } from '@/components/viewer-core/useViewer'
import { createSeededVibeProps } from '../helpers/createSeededVibeProps'
import { createDeferred } from '../helpers/useDataSourceTestUtils'

const DEFAULT_VIEWPORT_WIDTH = window.innerWidth

describe('VibeLayout fullscreen aside layout', () => {
  afterEach(() => {
    setViewportWidth(DEFAULT_VIEWPORT_WIDTH)
  })

  it('renders a fullscreen aside slot as a side column on wide desktop viewports', async () => {
    setViewportWidth(1_600)

    const wrapper = mount(Layout, {
      props: createSeededVibeProps([createImageItem('image-aside-column', 'Aside column item')]),
      slots: {
        'fullscreen-aside': () => h('div', { 'data-testid': 'custom-fullscreen-aside' }, 'Details column'),
      },
    })

    await flushDom()
    await wrapper.get('[data-testid="vibe-list-card"] button').trigger('click')
    await flushDom()

    expect(wrapper.get('[data-testid="vibe"]').attributes('data-surface-mode')).toBe('fullscreen')
    const aside = wrapper.get('[data-testid="vibe-fullscreen-aside"]')
    const asideColumn = wrapper.get('[data-testid="vibe-fullscreen-aside-column"]')
    const stage = wrapper.get('[data-testid="vibe-stage"]')
    const header = wrapper.get('[data-testid="vibe-fullscreen-header"]')

    expect(aside.text()).toContain('Details column')
    expect(asideColumn.classes()).toContain('vibe-fullscreen-aside-column-shell')
    expect(aside.classes()).toContain('w-[var(--vibe-fullscreen-aside-width,22rem)]')
    expect(aside.classes()).toContain('right-0')
    expect(stage.element.contains(aside.element)).toBe(false)
    expect(header.element.parentElement?.contains(aside.element)).toBe(false)

    wrapper.unmount()
  })

  it('renders a fullscreen aside slot as an overlay drawer on narrower desktop viewports', async () => {
    setViewportWidth(1_100)

    const wrapper = mount(Layout, {
      props: createSeededVibeProps([createImageItem('image-aside-drawer', 'Aside drawer item')]),
      slots: {
        'fullscreen-aside': () => h('div', { 'data-testid': 'custom-fullscreen-aside' }, 'Details drawer'),
      },
    })

    await flushDom()
    await wrapper.get('[data-testid="vibe-list-card"] button').trigger('click')
    await flushDom()

    expect(wrapper.get('[data-testid="vibe"]').attributes('data-surface-mode')).toBe('fullscreen')
    expect(wrapper.get('[data-testid="vibe-fullscreen-aside"]').text()).toContain('Details drawer')

    wrapper.unmount()
  })

  it('renders fullscreen header actions next to the pagination counter', async () => {
    setViewportWidth(1_280)

    const wrapper = mount(Layout, {
      props: createSeededVibeProps([createImageItem('image-header-action', 'Header action item')]),
      slots: {
        'fullscreen-header-actions': () => h('button', { 'data-testid': 'custom-header-action' }, 'Details'),
      },
    })

    await flushDom()
    await wrapper.get('[data-testid="vibe-list-card"] button').trigger('click')
    await flushDom()

    expect(wrapper.get('[data-testid="custom-header-action"]').exists()).toBe(true)
    expect(wrapper.get('[data-testid="vibe-pagination"]').text()).toContain('1 / 1')

    wrapper.unmount()
  })

  it('keeps populated fullscreen header chrome outside the media stage without rendering an empty footer', async () => {
    setViewportWidth(1_280)

    const wrapper = mount(Layout, {
      props: createSeededVibeProps([createImageItem('image-header-placement', 'Header placement item')], {
        nextCursor: 'page-2',
      }),
    })

    await flushDom()
    await wrapper.get('[data-testid="vibe-list-card"] button').trigger('click')
    await flushDom()

    const stage = wrapper.get('[data-testid="vibe-stage"]')
    const header = wrapper.get('[data-testid="vibe-fullscreen-header"]')
    const exitButton = wrapper.get('[data-testid="vibe-back-to-list"]')

    expect(header.text()).toContain('Header placement item')
    expect(header.text()).toContain('1 / 1')
    expect(exitButton.attributes('aria-label')).toBe('Exit viewer')
    expect(stage.element.contains(header.element)).toBe(false)
    expect(wrapper.find('[data-testid="vibe-fullscreen-footer"]').exists()).toBe(false)

    wrapper.unmount()
  })

  it('keeps fullscreen media controls over the stage without rendering an empty footer', async () => {
    setViewportWidth(1_280)

    const wrapper = mount(Layout, {
      props: createSeededVibeProps([createVideoItem('video-stage-controls', 'Stage controls item')], {
        nextCursor: 'page-2',
      }),
    })

    await flushDom()
    await wrapper.get('[data-testid="vibe-list-card"] button').trigger('click')
    await flushDom()

    const stage = wrapper.get('[data-testid="vibe-stage"]')
    const mediaBar = wrapper.get('[data-testid="vibe-media-bar"]')

    expect(stage.element.contains(mediaBar.element)).toBe(true)
    expect(wrapper.find('[data-testid="vibe-fullscreen-footer"]').exists()).toBe(false)

    wrapper.unmount()
  })

  it('renders custom fullscreen footer content below the stage', async () => {
    setViewportWidth(1_280)

    const wrapper = mount(Layout, {
      props: createSeededVibeProps([createImageItem('image-footer-slot', 'Footer slot item')]),
      slots: {
        'fullscreen-footer': () => h('div', { 'data-testid': 'custom-fullscreen-footer' }, 'Reactions'),
      },
    })

    await flushDom()
    await wrapper.get('[data-testid="vibe-list-card"] button').trigger('click')
    await flushDom()

    const stage = wrapper.get('[data-testid="vibe-stage"]')
    const footer = wrapper.get('[data-testid="vibe-fullscreen-footer"]')
    const customFooter = wrapper.get('[data-testid="custom-fullscreen-footer"]')

    expect(footer.element.contains(customFooter.element)).toBe(true)
    expect(stage.element.contains(customFooter.element)).toBe(false)

    wrapper.unmount()
  })

  it('exposes next fullscreen previews through the fullscreen slot props', async () => {
    setViewportWidth(1_280)
    let receivedNextPreviews: Array<{ asset: { kind: string; url: string | null }; index: number; item: VibeViewerItem }> = []

    const wrapper = mount(Layout, {
      props: createSeededVibeProps([
        createImageItem('image-current', 'Current item'),
        createImageItem('image-next-one', 'Next one'),
        createImageItem('image-next-two', 'Next two', { height: 320, width: 400 }),
        createImageItem('image-next-three', 'Next three'),
      ]),
      slots: {
        'fullscreen-aside': (slotProps: { nextPreviews: typeof receivedNextPreviews }) => {
          receivedNextPreviews = slotProps.nextPreviews
          return h('div', { 'data-testid': 'custom-fullscreen-aside' }, slotProps.nextPreviews.map((preview) => `${preview.index}:${preview.asset.kind}:${preview.asset.url}`).join('|'))
        },
      },
    })

    await flushDom()
    await wrapper.get('[data-testid="vibe-list-card"] button').trigger('click')
    await flushDom()

    expect(wrapper.findAll('[data-testid="vibe-fullscreen-next-preview"]')).toHaveLength(0)
    expect(receivedNextPreviews).toHaveLength(2)
    expect(receivedNextPreviews.map((preview) => preview.index)).toEqual([1, 2])
    expect(receivedNextPreviews.map((preview) => preview.item.id)).toEqual(['image-next-one', 'image-next-two'])
    expect(receivedNextPreviews[0].asset.url).toBe('https://example.com/image-next-one-preview.jpg')
    expect(receivedNextPreviews[0].asset.kind).toBe('image')
    expect(wrapper.get('[data-testid="custom-fullscreen-aside"]').text()).toContain('1:image:https://example.com/image-next-one-preview.jpg')

    wrapper.unmount()
  })

  it('renders a custom fullscreen status slot for loading-more state', async () => {
    setViewportWidth(1_280)
    const deferred = createDeferred<{ items: VibeViewerItem[]; nextPage: string | null }>()

    const wrapper = mount(Layout, {
      props: createSeededVibeProps([createImageItem('image-status-slot', 'Status slot item')], {
        nextCursor: 'page-2',
        resolve: vi.fn(() => deferred.promise),
        showStatusBadges: true,
      }),
      slots: {
        'fullscreen-status': ({ kind, message }: { kind: 'end' | 'failed' | 'filling' | 'initializing' | 'loading-more' | 'refreshing'; message: string }) =>
          h('div', { 'data-kind': kind, 'data-testid': 'custom-fullscreen-status' }, message),
      },
    })

    await flushDom()
    await wrapper.get('[data-testid="vibe-list-card"] button').trigger('click')
    await flushDom()
    void (wrapper.vm as unknown as VibeHandle).loadNext()
    await flushDom()

    expect(wrapper.get('[data-testid="custom-fullscreen-status"]').attributes('data-kind')).toBe('refreshing')
    expect(wrapper.get('[data-testid="custom-fullscreen-status"]').text()).toBe('Refreshing visible items')

    deferred.resolve({ items: [], nextPage: null })
    await flushDom()

    wrapper.unmount()
  })

  it('renders filling progress inside the fullscreen forward-fill placeholder', () => {
    const wrapper = mount(FullscreenSurface, {
      props: {
        active: true,
        activeIndex: 0,
        fillCollectedCount: 6,
        fillTargetCount: 20,
        hasNextPage: true,
        items: [],
        loading: true,
        phase: 'filling',
      },
    })

    expect(wrapper.get('[data-testid="vibe-forward-fill-message"]').text()).toBe('Filling the view')
    expect(wrapper.get('[data-testid="vibe-forward-fill-progress"]').text()).toContain('6 / 20 items')
    expect(wrapper.get('[data-testid="vibe-forward-fill-progress"]').text()).toContain('30%')
    expect(wrapper.get('[data-testid="vibe-forward-fill-progress-bar"]').attributes('style')).toContain('width: 30%')

    wrapper.unmount()
  })

  it('keeps fullscreen overlay content above the media bar for media items', async () => {
    setViewportWidth(1_280)
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve())
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})

    const wrapper = mount(Layout, {
      props: createSeededVibeProps([createVideoItem('video-overlay-layer', 'Overlay layer item')]),
      slots: {
        'fullscreen-overlay': () => h('div', { 'data-testid': 'custom-fullscreen-overlay' }, 'Reactions'),
      },
    })

    await flushDom()
    await wrapper.get('[data-testid="vibe-list-card"] button').trigger('click')
    await flushDom()

    expect(wrapper.get('[data-testid="vibe-media-bar"]').exists()).toBe(true)
    expect(wrapper.get('[data-testid="vibe-fullscreen-overlay"]').classes()).toContain('z-[6]')
    expect(wrapper.get('[data-testid="custom-fullscreen-overlay"]').exists()).toBe(true)

    wrapper.unmount()
  })

  it('restarts fullscreen video playback when the active video ends', async () => {
    setViewportWidth(1_280)
    const playSpy = vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve())
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})

    const wrapper = mount(Layout, {
      props: createSeededVibeProps([createVideoItem('video-loop-fallback', 'Loop fallback item')]),
    })

    await flushDom()
    await wrapper.get('[data-testid="vibe-list-card"] button').trigger('click')
    await flushDom()

    const video = wrapper.get('[data-testid="vibe-slide"][data-active="true"] video')
    const videoElement = video.element as HTMLVideoElement
    const initialPlayCalls = playSpy.mock.calls.length

    Object.defineProperty(videoElement, 'currentTime', {
      configurable: true,
      value: 9,
      writable: true,
    })
    await video.trigger('ended')
    await flushDom()

    expect(videoElement.currentTime).toBe(0)
    expect(playSpy.mock.calls.length).toBe(initialPlayCalls + 1)

    wrapper.unmount()
  })

  it('can suppress the fullscreen end badge', async () => {
    setViewportWidth(1_280)

    const wrapper = mount(Layout, {
      props: createSeededVibeProps([createImageItem('image-hide-end-badge', 'Hide end badge item')], {
        showEndBadge: false,
      }),
    })

    await flushDom()
    await wrapper.get('[data-testid="vibe-list-card"] button').trigger('click')
    await flushDom()

    expect(wrapper.get('[data-testid="vibe"]').attributes('data-surface-mode')).toBe('fullscreen')
    expect(wrapper.text()).not.toContain('End reached')

    wrapper.unmount()
  })

  it('suppresses fullscreen status output when showStatusBadges is false', async () => {
    setViewportWidth(1_280)
    const deferred = createDeferred<{ items: VibeViewerItem[]; nextPage: string | null }>()

    const wrapper = mount(Layout, {
      props: createSeededVibeProps([createImageItem('image-hide-status-badge', 'Hide status badge item')], {
        nextCursor: 'page-2',
        resolve: vi.fn(() => deferred.promise),
        showStatusBadges: false,
      }),
      slots: {
        'fullscreen-status': ({ kind, message }: { kind: 'end' | 'failed' | 'filling' | 'initializing' | 'loading-more' | 'refreshing'; message: string }) =>
          h('div', { 'data-kind': kind, 'data-testid': 'custom-fullscreen-status' }, message),
      },
    })

    await flushDom()
    await wrapper.get('[data-testid="vibe-list-card"] button').trigger('click')
    await flushDom()
    void (wrapper.vm as unknown as VibeHandle).loadNext()
    await flushDom()

    expect(wrapper.find('[data-testid="custom-fullscreen-status"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Loading more items')

    deferred.resolve({ items: [], nextPage: null })
    await flushDom()

    wrapper.unmount()
  })
})

function createImageItem(id: string, title?: string, dimensions: { height: number; width: number } = { height: 1_080, width: 1_920 }): VibeViewerItem {
  return {
    id,
    type: 'image',
    title,
    url: `https://example.com/${id}.jpg`,
    width: dimensions.width,
    height: dimensions.height,
    preview: {
      url: `https://example.com/${id}-preview.jpg`,
      width: dimensions.width,
      height: dimensions.height,
    },
  }
}

function createVideoItem(id: string, title?: string): VibeViewerItem {
  return {
    id,
    type: 'video',
    title,
    url: `https://example.com/${id}.mp4`,
    width: 1_920,
    height: 1_080,
    preview: {
      url: `https://example.com/${id}-preview.mp4`,
      width: 320,
      height: 180,
      mediaType: 'video',
    },
  }
}

async function flushDom() {
  await nextTick()
  await Promise.resolve()
  await nextTick()
}

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: width,
    writable: true,
  })
}
