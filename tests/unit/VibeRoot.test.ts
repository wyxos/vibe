import { mount } from '@vue/test-utils'
import type { Component } from 'vue'
import { defineComponent, h, nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'

const { resolveVibeAssetErrorKindMock } = vi.hoisted(() => ({
  resolveVibeAssetErrorKindMock: vi.fn(async () => 'generic' as const),
}))

vi.mock('@/components/vibe-root/loadError', () => ({
  getVibeAssetErrorLabel(kind: 'generic' | 'not-found') {
    return kind === 'not-found' ? '404' : 'Load error'
  },
  resolveVibeAssetErrorKind: resolveVibeAssetErrorKindMock,
}))

import VibeRoot from '@/components/VibeRoot.vue'
import type { VibeViewerItem } from '@/components/vibeViewer'

const DEFAULT_VIEWPORT_WIDTH = window.innerWidth
const CustomOtherIcon = defineComponent({
  name: 'CustomOtherIcon',
  template: '<svg data-testid="custom-other-icon" />',
})

describe('VibeRoot', () => {
  afterEach(() => {
    setViewportWidth(DEFAULT_VIEWPORT_WIDTH)
    resolveVibeAssetErrorKindMock.mockReset()
    resolveVibeAssetErrorKindMock.mockResolvedValue('generic')
    vi.restoreAllMocks()
  })

  it('defaults to the masonry list on desktop', async () => {
    setViewportWidth(1_280)
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve())
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})

    const wrapper = mount(VibeRoot, {
      props: {
        items: [createImageItem('image-1', 'Aurora moodboard'), createVideoItem('video-1', 'Launch loop teaser'), createOtherItem('archive-1', 'Release assets')],
      },
    })

    await flushDom()

    const listSurface = wrapper.get('[data-testid="vibe-root-list-surface"]')

    expect(wrapper.get('[data-testid="vibe-root"]').attributes('data-surface-mode')).toBe('list')
    expect(listSurface.attributes('data-visible')).toBe('true')
    expect(wrapper.get('[data-testid="vibe-root-fullscreen-surface"]').attributes('data-visible')).toBe('false')
    expect(wrapper.findAll('[data-testid="vibe-list-card"]')).toHaveLength(3)

    wrapper.unmount()
  })

  it('opens fullscreen from a desktop list tile and returns to the list', async () => {
    setViewportWidth(1_280)
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve())
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})

    let wrapper = mount(VibeRoot, {
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
    expect(wrapper.get('[data-testid="vibe-root"]').attributes('data-surface-mode')).toBe('list')

    await wrapper.get('[data-index="1"] button').trigger('click')
    await flushDom()

    expect(wrapper.get('[data-testid="vibe-root"]').attributes('data-surface-mode')).toBe('fullscreen')
    expect(wrapper.get('[data-testid="vibe-root-list-surface"]').attributes('data-visible')).toBe('false')
    expect(wrapper.get('[data-testid="vibe-root-fullscreen-surface"]').attributes('data-visible')).toBe('true')
    expect(wrapper.get('[data-testid="vibe-root-title"]').text()).toBe('Launch loop teaser')
    expect(wrapper.get('[data-testid="vibe-root-pagination"]').text()).toContain('2 / 2')

    await wrapper.get('[data-testid="vibe-root-back-to-list"]').trigger('click')
    await flushDom()

    expect(wrapper.get('[data-testid="vibe-root"]').attributes('data-surface-mode')).toBe('list')
    expect(wrapper.get('[data-testid="vibe-root-list-surface"]').attributes('data-visible')).toBe('true')
    expect(wrapper.get('[data-testid="vibe-root-fullscreen-surface"]').attributes('data-visible')).toBe('false')
    expect(wrapper.find('[data-testid="vibe-root-back-to-list"]').exists()).toBe(false)

    wrapper.unmount()
  })

  it('forces fullscreen on mobile and hides the title when the active item has no title', async () => {
    setViewportWidth(390)

    const item = createImageItem('image-3', undefined)
    const wrapper = mount(VibeRoot, {
      props: {
        items: [item],
      },
    })

    await flushDom()

    expect(wrapper.get('[data-testid="vibe-root"]').attributes('data-surface-mode')).toBe('fullscreen')
    expect(wrapper.find('[data-testid="vibe-root-title"]').exists()).toBe(false)
    expect(wrapper.get('img').attributes('src')).toBe(item.url)

    wrapper.unmount()
  })

  it('shows an image spinner until the active image finishes loading', async () => {
    setViewportWidth(390)

    const wrapper = mount(VibeRoot, {
      props: {
        items: [createImageItem('image-4', 'Image loading')],
      },
    })

    expect(wrapper.get('[data-testid="vibe-root-asset-spinner"]').exists()).toBe(true)
    expect(wrapper.get('img').classes()).toContain('opacity-0')

    await wrapper.get('img').trigger('load')
    await flushDom()

    expect(wrapper.find('[data-testid="vibe-root-asset-spinner"]').exists()).toBe(false)
    expect(wrapper.get('img').classes()).toContain('opacity-100')

    wrapper.unmount()
  })

  it('shows media spinners before video and audio are ready', async () => {
    setViewportWidth(390)

    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve())
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})

    const videoWrapper = mount(VibeRoot, {
      props: {
        items: [createVideoItem('video-3', 'Video loading')],
      },
    })

    await flushDom()

    expect(videoWrapper.get('[data-testid="vibe-root-asset-spinner"]').exists()).toBe(true)
    expect(videoWrapper.get('video').classes()).toContain('opacity-0')

    videoWrapper.unmount()

    const audioWrapper = mount(VibeRoot, {
      props: {
        items: [createAudioItem('audio-1', 'Audio loading')],
      },
    })

    await flushDom()

    expect(audioWrapper.get('[data-testid="vibe-root-asset-spinner"]').exists()).toBe(true)

    audioWrapper.unmount()
  })

  it('renders a 404 state for a fullscreen image load failure', async () => {
    setViewportWidth(390)
    resolveVibeAssetErrorKindMock.mockResolvedValueOnce('not-found')

    const wrapper = mount(VibeRoot, {
      props: {
        items: [createImageItem('image-404', 'Missing image')],
      },
    })

    await wrapper.get('img').trigger('error')
    await flushDom()

    expect(wrapper.get('[data-testid="vibe-root-asset-error"]').attributes('data-kind')).toBe('not-found')
    expect(wrapper.text()).toContain('404')
    expect(wrapper.find('[data-testid="vibe-root-asset-spinner"]').exists()).toBe(false)

    wrapper.unmount()
  })

  it('renders a generic error state for a fullscreen audio load failure and hides the media bar', async () => {
    setViewportWidth(390)
    resolveVibeAssetErrorKindMock.mockResolvedValueOnce('generic')

    const wrapper = mount(VibeRoot, {
      props: {
        items: [createAudioItem('audio-broken', 'Broken audio')],
      },
    })

    await flushDom()
    await wrapper.get('audio').trigger('error')
    await flushDom()

    expect(wrapper.get('[data-testid="vibe-root-asset-error"]').attributes('data-kind')).toBe('generic')
    expect(wrapper.text()).toContain('Load error')
    expect(wrapper.find('[data-testid="vibe-root-media-bar"]').exists()).toBe(false)

    wrapper.unmount()
  })

  it('renders fallback list tiles for non-previewable items on desktop', async () => {
    setViewportWidth(1_280)

    const wrapper = mount(VibeRoot, {
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

    const listSurface = wrapper.get('[data-testid="vibe-root-list-surface"]')

    expect(wrapper.get('[data-testid="vibe-root"]').attributes('data-surface-mode')).toBe('list')
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('video').exists()).toBe(false)
    expect(listSurface.text()).not.toContain('Archive fallback')
    expect(wrapper.get('[data-testid="vibe-list-card"]').attributes('style')).toContain('height: 296px;')
    expect(wrapper.get('[data-testid="vibe-list-card"] button').classes()).toContain('h-full')

    wrapper.unmount()
  })

  it('renders a custom item-icon slot for other items in list and fullscreen mode', async () => {
    setViewportWidth(1_280)

    const wrapper = mount(VibeRoot, {
      props: {
        items: [createOtherItem('other-custom-icon', 'Custom icon item')],
      },
      slots: {
        'item-icon': ({ item, icon }: { icon: unknown; item: VibeViewerItem }) =>
          h((item.type === 'other' ? CustomOtherIcon : icon) as Component),
      },
    })

    await flushDom()

    const listSurface = wrapper.get('[data-testid="vibe-root-list-surface"]')
    const fullscreenSurface = wrapper.get('[data-testid="vibe-root-fullscreen-surface"]')

    expect(listSurface.find('[data-testid="custom-other-icon"]').exists()).toBe(true)

    await wrapper.get('[data-testid="vibe-list-card"] button').trigger('click')
    await flushDom()

    expect(wrapper.get('[data-testid="vibe-root"]').attributes('data-surface-mode')).toBe('fullscreen')
    expect(fullscreenSurface.find('[data-testid="custom-other-icon"]').exists()).toBe(true)

    wrapper.unmount()
  })

  it('renders list images even when the URL has no file extension', async () => {
    setViewportWidth(1_280)

    const wrapper = mount(VibeRoot, {
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

    expect(wrapper.get('[data-testid="vibe-root"]').attributes('data-surface-mode')).toBe('list')
    expect(wrapper.find('img').exists()).toBe(true)
    expect(wrapper.find('video').exists()).toBe(false)

    wrapper.unmount()
  })

  it('renders ultra-wide image previews as square desktop tiles', async () => {
    setViewportWidth(1_280)

    const wrapper = mount(VibeRoot, {
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

    expect(wrapper.get('[data-testid="vibe-root"]').attributes('data-surface-mode')).toBe('list')
    expect(wrapper.get('[data-testid="vibe-list-card"]').attributes('style')).toContain('height: 296px;')

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
