import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'

import Layout from '@/components/Layout.vue'
import type { VibeViewerItem } from '@/components/viewer'

const DEFAULT_VIEWPORT_WIDTH = window.innerWidth

describe('VibeLayout asset load events', () => {
  afterEach(() => {
    setViewportWidth(DEFAULT_VIEWPORT_WIDTH)
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('batches desktop grid asset successes into one asset-loads emission', async () => {
    setViewportWidth(1_280)
    vi.useFakeTimers()

    const onAssetLoads = vi.fn()
    const wrapper = mount(Layout, {
      props: {
        items: [createImageItem('grid-ready-1', 'Ready 1'), createImageItem('grid-ready-2', 'Ready 2')],
        onAssetLoads,
      },
    })

    await flushDom()

    const listImages = wrapper.get('[data-testid="vibe-list-surface"]').findAll('img')
    expect(listImages).toHaveLength(2)

    await listImages[0].trigger('load')
    await listImages[1].trigger('load')
    await flushDom()

    expect(onAssetLoads).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(150)
    await flushDom()

    expect(onAssetLoads).toHaveBeenCalledTimes(1)
    expect(onAssetLoads.mock.calls[0][0]).toEqual([
      expect.objectContaining({
        item: expect.objectContaining({ id: 'grid-ready-1' }),
        occurrenceKey: expect.any(String),
        surface: 'grid',
        url: 'https://example.com/grid-ready-1-preview.jpg',
      }),
      expect.objectContaining({
        item: expect.objectContaining({ id: 'grid-ready-2' }),
        occurrenceKey: expect.any(String),
        surface: 'grid',
        url: 'https://example.com/grid-ready-2-preview.jpg',
      }),
    ])

    wrapper.unmount()
  })

  it('emits fullscreen asset successes with the original asset url', async () => {
    setViewportWidth(390)
    vi.useFakeTimers()

    const onAssetLoads = vi.fn()
    const wrapper = mount(Layout, {
      props: {
        items: [
          createImageItem('image-ready', 'Ready image'),
          createImageItem('image-preloaded', 'Preloaded image'),
          createImageItem('image-ahead', 'Ahead image'),
        ],
        onAssetLoads,
      },
    })

    await wrapper.get('[data-index="1"] img').trigger('load')
    await flushDom()
    await vi.advanceTimersByTimeAsync(150)
    await flushDom()

    expect(onAssetLoads).toHaveBeenCalledTimes(1)
    expect(onAssetLoads.mock.calls[0][0]).toEqual([
      expect.objectContaining({
        item: expect.objectContaining({ id: 'image-preloaded' }),
        occurrenceKey: expect.any(String),
        surface: 'fullscreen',
        url: 'https://example.com/image-preloaded.jpg',
      }),
    ])

    wrapper.unmount()
  })
})

function createImageItem(id: string, title?: string): VibeViewerItem {
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
