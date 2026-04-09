/* eslint-disable max-lines */
import { mount } from '@vue/test-utils'
import type { Component } from 'vue'
import { defineComponent, h, nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'

const { resolveVibeAssetErrorKindMock } = vi.hoisted(() => ({
  resolveVibeAssetErrorKindMock: vi.fn(async () => 'generic' as const),
}))

vi.mock('@/components/viewer-core/loadError', () => ({
  canRetryVibeAssetError(kind: 'generic' | 'not-found' | null | undefined) {
    return kind === 'generic'
  },
  getVibeAssetErrorLabel(kind: 'generic' | 'not-found') {
    return kind === 'not-found' ? '404' : 'Load error'
  },
  resolveVibeAssetErrorKind: resolveVibeAssetErrorKindMock,
}))

import Layout from '@/components/Layout.vue'
import type { VibeViewerItem } from '@/components/viewer'
import type { VibeHandle } from '@/components/viewer-core/useViewer'

const DEFAULT_VIEWPORT_WIDTH = window.innerWidth
const CustomOtherIcon = defineComponent({
  name: 'CustomOtherIcon',
  template: '<svg data-testid="custom-other-icon" />',
})

describe('VibeLayout', () => {
  afterEach(() => {
    setViewportWidth(DEFAULT_VIEWPORT_WIDTH)
    resolveVibeAssetErrorKindMock.mockReset()
    resolveVibeAssetErrorKindMock.mockResolvedValue('generic')
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('defaults to the masonry list on desktop', async () => {
    setViewportWidth(1_280)
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve())
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})

    const wrapper = mount(Layout, {
      props: {
        items: [createImageItem('image-1', 'Aurora moodboard'), createVideoItem('video-1', 'Launch loop teaser'), createOtherItem('archive-1', 'Release assets')],
      },
    })

    await flushDom()

    const listSurface = wrapper.get('[data-testid="vibe-list-surface"]')

    expect(wrapper.get('[data-testid="vibe"]').attributes('data-surface-mode')).toBe('list')
    expect(listSurface.attributes('data-visible')).toBe('true')
    expect(wrapper.get('[data-testid="vibe-fullscreen-surface"]').attributes('data-visible')).toBe('false')
    expect(wrapper.findAll('[data-testid="vibe-list-card"]')).toHaveLength(3)

    wrapper.unmount()
  })

  it('opens fullscreen from a desktop list tile and returns to the list', async () => {
    setViewportWidth(1_280)
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve())
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})

    let wrapper = mount(Layout, {
      props: {
        activeIndex: 0,
        items: [createImageItem('image-2', 'Aurora moodboard'), createVideoItem('video-2', 'Launch loop teaser')],
        'onUpdate:activeIndex': async (value: number) => {
          await wrapper.setProps({
            activeIndex: value,
          })
        },
      },
    })

    await flushDom()
    expect(wrapper.get('[data-testid="vibe"]').attributes('data-surface-mode')).toBe('list')

    await wrapper.get('[data-index="1"] button').trigger('click')
    await flushDom()

    expect(wrapper.get('[data-testid="vibe"]').attributes('data-surface-mode')).toBe('fullscreen')
    expect(wrapper.get('[data-testid="vibe-list-surface"]').attributes('data-visible')).toBe('false')
    expect(wrapper.get('[data-testid="vibe-fullscreen-surface"]').attributes('data-visible')).toBe('true')
    expect(wrapper.get('[data-testid="vibe-title"]').text()).toBe('Launch loop teaser')
    expect(wrapper.get('[data-testid="vibe-pagination"]').text()).toContain('2 / 2')

    await wrapper.get('[data-testid="vibe-back-to-list"]').trigger('click')
    await flushDom()

    expect(wrapper.get('[data-testid="vibe"]').attributes('data-surface-mode')).toBe('list')
    expect(wrapper.get('[data-testid="vibe-list-surface"]').attributes('data-visible')).toBe('true')
    expect(wrapper.get('[data-testid="vibe-fullscreen-surface"]').attributes('data-visible')).toBe('false')
    expect(wrapper.find('[data-testid="vibe-back-to-list"]').exists()).toBe(false)

    wrapper.unmount()
  })

  it('forces fullscreen on mobile and hides the title when the active item has no title', async () => {
    setViewportWidth(390)

    const item = createImageItem('image-3', undefined)
    const wrapper = mount(Layout, {
      props: {
        items: [item],
      },
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
      props: {
        items: [createImageItem('image-4', 'Image loading')],
      },
    })

    expect(wrapper.get('[data-testid="vibe-asset-spinner"]').exists()).toBe(true)
    expect(wrapper.get('img').classes()).toContain('opacity-0')

    await wrapper.get('img').trigger('load')
    await flushDom()

    expect(wrapper.find('[data-testid="vibe-asset-spinner"]').exists()).toBe(false)
    expect(wrapper.get('img').classes()).toContain('opacity-100')

    wrapper.unmount()
  })

  it('preloads the next two fullscreen image slides and drops stale sources after a jump', async () => {
    setViewportWidth(390)

    let wrapper = mount(Layout, {
      props: {
        activeIndex: 0,
        items: [
          createImageItem('image-preload-1', 'Image 1'),
          createImageItem('image-preload-2', 'Image 2'),
          createImageItem('image-preload-3', 'Image 3'),
          createImageItem('image-preload-4', 'Image 4'),
          createImageItem('image-preload-5', 'Image 5'),
          createImageItem('image-preload-6', 'Image 6'),
        ],
        'onUpdate:activeIndex': async (value: number) => {
          await wrapper.setProps({
            activeIndex: value,
          })
        },
      },
    })

    await flushDom()

    expect(wrapper.get('[data-index="0"] img').attributes('src')).toBe('https://example.com/image-preload-1.jpg')
    expect(wrapper.get('[data-index="1"] img').attributes('src')).toBe('https://example.com/image-preload-2.jpg')
    expect(wrapper.get('[data-index="2"] img').attributes('src')).toBe('https://example.com/image-preload-3.jpg')

    await wrapper.setProps({
      activeIndex: 3,
    })
    await flushDom()

    expect(wrapper.get('[data-index="1"] img').attributes('src')).toBeUndefined()
    expect(wrapper.get('[data-index="2"] img').attributes('src')).toBeUndefined()
    expect(wrapper.get('[data-index="3"] img').attributes('src')).toBe('https://example.com/image-preload-4.jpg')
    expect(wrapper.get('[data-index="4"] img').attributes('src')).toBe('https://example.com/image-preload-5.jpg')
    expect(wrapper.get('[data-index="5"] img').attributes('src')).toBe('https://example.com/image-preload-6.jpg')

    wrapper.unmount()
  })

  it('reuses a preloaded fullscreen image when it becomes active', async () => {
    setViewportWidth(390)

    let wrapper = mount(Layout, {
      props: {
        activeIndex: 0,
        items: [
          createImageItem('image-reuse-1', 'Image 1'),
          createImageItem('image-reuse-2', 'Image 2'),
          createImageItem('image-reuse-3', 'Image 3'),
        ],
        'onUpdate:activeIndex': async (value: number) => {
          await wrapper.setProps({
            activeIndex: value,
          })
        },
      },
    })

    await flushDom()
    await wrapper.get('[data-index="2"] img').trigger('load')
    await flushDom()

    await wrapper.setProps({
      activeIndex: 2,
    })
    await flushDom()

    expect(wrapper.get('[data-testid="vibe-pagination"]').text()).toContain('3 / 3')
    expect(wrapper.find('[data-testid="vibe-asset-spinner"]').exists()).toBe(false)
    expect(wrapper.get('[data-index="2"] img').classes()).toContain('opacity-100')

    wrapper.unmount()
  })

  it('shows media spinners before video and audio are ready', async () => {
    setViewportWidth(390)

    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve())
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})

    const videoWrapper = mount(Layout, {
      props: {
        items: [createVideoItem('video-3', 'Video loading')],
      },
    })

    await flushDom()

    expect(videoWrapper.get('[data-testid="vibe-asset-spinner"]').exists()).toBe(true)
    expect(videoWrapper.get('video').classes()).toContain('opacity-0')

    videoWrapper.unmount()

    const audioWrapper = mount(Layout, {
      props: {
        items: [createAudioItem('audio-1', 'Audio loading')],
      },
    })

    await flushDom()

    expect(audioWrapper.get('[data-testid="vibe-asset-spinner"]').exists()).toBe(true)
    audioWrapper.unmount()
  })

  it('renders a 404 state for a fullscreen image load failure', async () => {
    setViewportWidth(390)
    resolveVibeAssetErrorKindMock.mockResolvedValueOnce('not-found')
    const wrapper = mount(Layout, {
      props: {
        items: [createImageItem('image-404', 'Missing image')],
      },
    })

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
      props: {
        items: [createAudioItem('audio-broken', 'Broken audio')],
      },
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
      props: {
        items: [createImageItem('image-retry', 'Retry image')],
      },
    })
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

  it('renders fallback list tiles for non-previewable items on desktop', async () => {
    setViewportWidth(1_280)

    const wrapper = mount(Layout, {
      props: {
        items: [createOtherItem('archive-2', 'Archive fallback', {
          preview: {
            url: 'https://example.com/archive-2-preview.jpg',
            width: 320,
            height: 640,
          },
        })],
      },
    })

    await flushDom()

    const listSurface = wrapper.get('[data-testid="vibe-list-surface"]')

    expect(wrapper.get('[data-testid="vibe"]').attributes('data-surface-mode')).toBe('list')
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('video').exists()).toBe(false)
    expect(listSurface.text()).not.toContain('Archive fallback')
    expect(wrapper.get('[data-testid="vibe-list-card"]').attributes('style')).toContain('height: 296px;')
    expect(wrapper.get('[data-testid="vibe-list-card"] button').classes()).toContain('h-full')

    wrapper.unmount()
  })

  it('renders a custom item-icon slot for other items in list and fullscreen mode', async () => {
    setViewportWidth(1_280)

    const wrapper = mount(Layout, {
      props: {
        items: [createOtherItem('other-custom-icon', 'Custom icon item')],
      },
      slots: {
        'item-icon': ({ item, icon }: { icon: unknown; item: VibeViewerItem }) =>
          h((item.type === 'other' ? CustomOtherIcon : icon) as Component),
      },
    })

    await flushDom()

    const listSurface = wrapper.get('[data-testid="vibe-list-surface"]')
    const fullscreenSurface = wrapper.get('[data-testid="vibe-fullscreen-surface"]')

    expect(listSurface.find('[data-testid="custom-other-icon"]').exists()).toBe(true)

    await wrapper.get('[data-testid="vibe-list-card"] button').trigger('click')
    await flushDom()

    expect(wrapper.get('[data-testid="vibe"]').attributes('data-surface-mode')).toBe('fullscreen')
    expect(fullscreenSurface.find('[data-testid="custom-other-icon"]').exists()).toBe(true)

    wrapper.unmount()
  })

  it('forwards a grid overlay slot and keeps overlay actions from opening fullscreen', async () => {
    setViewportWidth(1_280)

    const overlayClick = vi.fn()
    const wrapper = mount(Layout, {
      props: {
        items: [createImageItem('image-overlay-slot', 'Overlay slot image')],
      },
      slots: {
        'grid-item-overlay': ({ hovered }: { hovered: boolean }) =>
          h(
            'button',
            {
              class: 'pointer-events-auto',
              'data-hovered': hovered ? 'true' : 'false',
              'data-testid': 'grid-overlay-action',
              onClick: overlayClick,
            },
            'Like',
          ),
      },
    })

    await flushDom()

    await wrapper.get('[data-testid="vibe-list-card-inner"]').trigger('pointerenter')
    await flushDom()

    expect(wrapper.get('[data-testid="grid-overlay-action"]').attributes('data-hovered')).toBe('true')

    await wrapper.get('[data-testid="grid-overlay-action"]').trigger('click')
    await flushDom()

    expect(overlayClick).toHaveBeenCalledTimes(1)
    expect(wrapper.get('[data-testid="vibe"]').attributes('data-surface-mode')).toBe('list')

    await wrapper.get('[data-testid="vibe-list-card-open"]').trigger('click')
    await flushDom()

    expect(wrapper.get('[data-testid="vibe"]').attributes('data-surface-mode')).toBe('fullscreen')

    wrapper.unmount()
  })

  it('renders list images even when the URL has no file extension', async () => {
    setViewportWidth(1_280)

    const wrapper = mount(Layout, {
      props: {
        items: [createImageItem('image-5', 'Extensionless image', {
          url: 'https://picsum.photos/id/1003/1800/2700',
          preview: {
            url: 'https://picsum.photos/id/1003/600/900',
            width: 600,
            height: 900,
          },
        })],
      },
    })

    await flushDom()

    expect(wrapper.get('[data-testid="vibe"]').attributes('data-surface-mode')).toBe('list')
    expect(wrapper.find('img').exists()).toBe(true)
    expect(wrapper.find('video').exists()).toBe(false)

    wrapper.unmount()
  })

  it('renders ultra-wide image previews as square desktop tiles', async () => {
    setViewportWidth(1_280)

    const wrapper = mount(Layout, {
      props: {
        items: [createImageItem('image-6', 'Square preview clamp', {
          preview: {
            url: 'https://example.com/image-6-preview.jpg',
            width: 1_200,
            height: 400,
          },
        })],
      },
    })

    await flushDom()

    expect(wrapper.get('[data-testid="vibe"]').attributes('data-surface-mode')).toBe('list')
    expect(wrapper.get('[data-testid="vibe-list-card"]').attributes('style')).toContain('height: 296px;')

    wrapper.unmount()
  })

  it('exposes remove, restore, and undo that operate on duplicate ids', async () => {
    setViewportWidth(1_280)

    const wrapper = mount(Layout, {
      props: {
        items: [
          createImageItem('duplicate', 'Duplicate 1'),
          createImageItem('stable', 'Stable'),
          createImageItem('duplicate', 'Duplicate 2'),
        ],
      },
    })

    await flushDom()

    const handle = wrapper.vm as unknown as VibeHandle

    expect(typeof handle.remove).toBe('function')
    expect(typeof handle.restore).toBe('function')
    expect(typeof handle.undo).toBe('function')
    expect(handle.status.itemCount).toBe(3)
    expect(handle.status.loadState).toBe('loaded')
    expect(handle.status.surfaceMode).toBe('list')
    expect(wrapper.findAll('[data-testid="vibe-list-card"]')).toHaveLength(3)

    expect(handle.remove('duplicate').ids).toEqual(['duplicate'])
    await flushDom()

    expect(wrapper.findAll('[data-testid="vibe-list-card"]')).toHaveLength(1)
    expect(handle.getRemovedIds()).toEqual(['duplicate'])
    expect(handle.status.itemCount).toBe(1)
    expect(handle.status.removedCount).toBe(1)

    expect(handle.undo()?.ids).toEqual(['duplicate'])
    await flushDom()

    expect(wrapper.findAll('[data-testid="vibe-list-card"]')).toHaveLength(3)
    expect(handle.getRemovedIds()).toEqual([])
    expect(handle.status.itemCount).toBe(3)
    expect(handle.status.removedCount).toBe(0)

    handle.remove('duplicate')
    await flushDom()
    expect(wrapper.findAll('[data-testid="vibe-list-card"]')).toHaveLength(1)

    expect(handle.restore('duplicate').ids).toEqual(['duplicate'])
    await flushDom()

    expect(wrapper.findAll('[data-testid="vibe-list-card"]')).toHaveLength(3)
    expect(handle.status.itemCount).toBe(3)

    wrapper.unmount()
  })

})

function createImageItem(id: string, title?: string, overrides: Partial<VibeViewerItem> = {}): VibeViewerItem {
  return {
    id,
    type: 'image',
    title,
    url: `https://example.com/${id}.jpg`,
    width: 1_920,
    height: 1_080,
    preview: {
      url: `https://example.com/${id}-preview.jpg`,
      width: 320,
      height: 180,
    },
    ...overrides,
  }
}

function createVideoItem(id: string, title?: string): VibeViewerItem {
  return {
    ...createImageItem(id, title),
    type: 'video',
    url: `https://example.com/${id}.mp4`,
    preview: {
      url: `https://example.com/${id}-preview.mp4`,
      width: 320,
      height: 180,
    },
  }
}

function createAudioItem(id: string, title?: string): VibeViewerItem {
  return {
    id,
    type: 'audio',
    title,
    url: `https://example.com/${id}.mp3`,
    preview: {
      url: `https://example.com/${id}.mp3`,
    },
  }
}

function createOtherItem(id: string, title?: string, overrides: Partial<VibeViewerItem> = {}): VibeViewerItem {
  return {
    id,
    type: 'other',
    title,
    url: `https://example.com/${id}.zip`,
    ...overrides,
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
