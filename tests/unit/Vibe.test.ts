import { mount } from '@vue/test-utils'
import type { Component } from 'vue'
import { defineComponent, h } from 'vue'
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
import type { VibeViewerItem } from '@/components/viewer'
import type { VibeHandle } from '@/components/viewer-core/useViewer'
import { createSeededVibeProps } from '../helpers/createSeededVibeProps'
import { createAudioItem, createImageItem, createOtherItem, createVideoItem, flushDom, setViewportHeight, setViewportWidth } from '../helpers/vibeTestUtils'

const DEFAULT_VIEWPORT_WIDTH = window.innerWidth
const DEFAULT_VIEWPORT_HEIGHT = window.innerHeight
const CustomOtherIcon = defineComponent({
  name: 'CustomOtherIcon',
  template: '<svg data-testid="custom-other-icon" />',
})
describe('VibeLayout', () => {
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

  it('defaults to the masonry list on desktop', async () => {
    setViewportWidth(1_280)
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve())
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})

    const wrapper = mount(Layout, {
      props: createSeededVibeProps([
        createImageItem('image-1', 'Aurora moodboard'),
        createVideoItem('video-1', 'Launch loop teaser'),
        createOtherItem('archive-1', 'Release assets'),
      ]),
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

    const wrapper = mount(Layout, {
      props: createSeededVibeProps([
        createImageItem('image-2', 'Aurora moodboard'),
        createVideoItem('video-2', 'Launch loop teaser'),
      ], {
        activeIndex: 0,
      }),
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

  it('renders fallback list tiles for non-previewable items on desktop', async () => {
    setViewportWidth(1_280)

    const wrapper = mount(Layout, {
      props: createSeededVibeProps([createOtherItem('archive-2', 'Archive fallback', {
          preview: {
            url: 'https://example.com/archive-2-preview.jpg',
            width: 320,
            height: 640,
          },
        })]),
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
      props: createSeededVibeProps([createOtherItem('other-custom-icon', 'Custom icon item')]),
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

  it('renders audio preview art as the fullscreen audio cover', async () => {
    setViewportWidth(1_280)
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve())
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
    const coverUrl = 'https://example.com/audio-cover.jpg'

    const wrapper = mount(Layout, {
      props: createSeededVibeProps([createAudioItem('audio-cover', 'Cover track', {
        preview: {
          mediaType: 'image',
          url: coverUrl,
        },
      })]),
    })

    await flushDom()
    await wrapper.get('[data-testid="vibe-list-card"] button').trigger('click')
    await flushDom()

    const fullscreenSurface = wrapper.get('[data-testid="vibe-fullscreen-surface"]')
    const cover = fullscreenSurface.get('[data-testid="vibe-fullscreen-audio-cover"]')

    expect(wrapper.get('[data-testid="vibe"]').attributes('data-surface-mode')).toBe('fullscreen')
    expect(cover.attributes('src')).toBe(coverUrl)
    expect(cover.classes()).toContain('object-cover')

    wrapper.unmount()
  })

  it('forwards a grid overlay slot and keeps overlay actions from opening fullscreen', async () => {
    setViewportWidth(1_280)

    const overlayClick = vi.fn()
    const wrapper = mount(Layout, {
      props: createSeededVibeProps([createImageItem('image-overlay-slot', 'Overlay slot image')]),
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
      props: createSeededVibeProps([createImageItem('image-5', 'Extensionless image', {
          url: 'https://picsum.photos/id/1003/1800/2700',
          preview: {
            url: 'https://picsum.photos/id/1003/600/900',
            width: 600,
            height: 900,
          },
        })]),
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
      props: createSeededVibeProps([createImageItem('image-6', 'Square preview clamp', {
          preview: {
            url: 'https://example.com/image-6-preview.jpg',
            width: 1_200,
            height: 400,
          },
        })]),
    })

    await flushDom()

    expect(wrapper.get('[data-testid="vibe"]').attributes('data-surface-mode')).toBe('list')
    expect(wrapper.get('[data-testid="vibe-list-card"]').attributes('style')).toContain('height: 296px;')

    wrapper.unmount()
  })

  it('exposes remove, restore, and undo that operate on duplicate ids', async () => {
    setViewportWidth(1_280)

    const wrapper = mount(Layout, {
      props: createSeededVibeProps([
        createImageItem('duplicate', 'Duplicate 1'),
        createImageItem('stable', 'Stable'),
        createImageItem('duplicate', 'Duplicate 2'),
      ]),
    })

    await flushDom()

    const handle = wrapper.vm as unknown as VibeHandle

    expect(typeof handle.lockPageLoading).toBe('function')
    expect(typeof handle.remove).toBe('function')
    expect(typeof handle.restore).toBe('function')
    expect(typeof handle.undo).toBe('function')
    expect(handle.status.itemCount).toBe(3)
    expect(handle.status.loadState).toBe('loaded')
    expect(handle.status.pageLoadingLocked).toBe(false)
    expect(handle.status.surfaceMode).toBe('list')
    expect(handle.status.removedIds).toEqual([])
    expect(wrapper.findAll('[data-testid="vibe-list-card"]')).toHaveLength(3)

    handle.lockPageLoading()
    await flushDom()

    expect(handle.status.pageLoadingLocked).toBe(true)

    handle.unlockPageLoading()
    await flushDom()

    expect(handle.status.pageLoadingLocked).toBe(false)

    expect(handle.remove('duplicate').ids).toEqual(['duplicate'])
    await flushDom()

    expect(wrapper.findAll('[data-testid="vibe-list-card"]')).toHaveLength(1)
    expect(handle.getRemovedIds()).toEqual(['duplicate'])
    expect(handle.status.removedIds).toEqual(['duplicate'])
    expect(handle.status.itemCount).toBe(1)
    expect(handle.status.removedCount).toBe(1)

    expect(handle.undo()?.ids).toEqual(['duplicate'])
    await flushDom()

    expect(wrapper.findAll('[data-testid="vibe-list-card"]')).toHaveLength(3)
    expect(handle.getRemovedIds()).toEqual([])
    expect(handle.status.removedIds).toEqual([])
    expect(handle.status.itemCount).toBe(3)
    expect(handle.status.removedCount).toBe(0)

    handle.remove('duplicate')
    await flushDom()
    expect(wrapper.findAll('[data-testid="vibe-list-card"]')).toHaveLength(1)
    expect(handle.status.removedIds).toEqual(['duplicate'])

    expect(handle.restore('duplicate').ids).toEqual(['duplicate'])
    await flushDom()

    expect(wrapper.findAll('[data-testid="vibe-list-card"]')).toHaveLength(3)
    expect(handle.status.removedIds).toEqual([])
    expect(handle.status.itemCount).toBe(3)

    handle.remove('duplicate')
    await flushDom()
    expect(handle.status.removedIds).toEqual(['duplicate'])

    handle.clearRemoved()
    await flushDom()

    expect(wrapper.findAll('[data-testid="vibe-list-card"]')).toHaveLength(3)
    expect(handle.getRemovedIds()).toEqual([])
    expect(handle.status.removedIds).toEqual([])
    expect(handle.status.removedCount).toBe(0)

    wrapper.unmount()
  })

  it('restores the prior list scroll position after exiting fullscreen on desktop', async () => {
    setViewportWidth(1_280)
    setViewportHeight(600)
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve())
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})

    const wrapper = mount(Layout, {
      props: createSeededVibeProps(Array.from({ length: 24 }, (_, index) =>
        createImageItem(`image-scroll-${index + 1}`, `Scroll item ${index + 1}`),
      )),
    })

    await flushDom()

    const scrollViewport = wrapper.get('[data-testid="vibe-list-scroll"]').element as HTMLElement
    scrollViewport.scrollTop = 640
    await wrapper.get('[data-testid="vibe-list-scroll"]').trigger('scroll')
    await flushDom()
    const preservedScrollTop = scrollViewport.scrollTop

    await wrapper.get('[data-index="8"] button').trigger('click')
    await flushDom()

    expect(wrapper.get('[data-testid="vibe"]').attributes('data-surface-mode')).toBe('fullscreen')

    scrollViewport.scrollTop = 0

    await wrapper.get('[data-testid="vibe-back-to-list"]').trigger('click')
    await flushDom()

    expect(wrapper.get('[data-testid="vibe"]').attributes('data-surface-mode')).toBe('list')
    expect(scrollViewport.scrollTop).toBe(preservedScrollTop)

    wrapper.unmount()
  })
})
