import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
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

const DEFAULT_VIEWPORT_WIDTH = window.innerWidth

describe('VibeLayout asset error events', () => {
  afterEach(() => {
    setViewportWidth(DEFAULT_VIEWPORT_WIDTH)
    resolveVibeAssetErrorKindMock.mockReset()
    resolveVibeAssetErrorKindMock.mockResolvedValue('generic')
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('batches desktop grid asset failures into one asset-errors emission', async () => {
    setViewportWidth(1_280)
    vi.useFakeTimers()

    const onAssetErrors = vi.fn()
    const wrapper = mount(Layout, {
      props: {
        items: [createImageItem('grid-broken-1', 'Broken 1'), createImageItem('grid-broken-2', 'Broken 2')],
        onAssetErrors,
      },
    })

    await flushDom()

    const listImages = wrapper.get('[data-testid="vibe-list-surface"]').findAll('img')
    expect(listImages).toHaveLength(2)

    await listImages[0].trigger('error')
    await listImages[1].trigger('error')
    await flushDom()

    expect(onAssetErrors).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(150)
    await flushDom()

    expect(onAssetErrors).toHaveBeenCalledTimes(1)
    expect(onAssetErrors.mock.calls[0][0]).toEqual([
      expect.objectContaining({
        item: expect.objectContaining({ id: 'grid-broken-1' }),
        kind: 'generic',
        occurrenceKey: expect.any(String),
        surface: 'grid',
        url: 'https://example.com/grid-broken-1-preview.jpg',
      }),
      expect.objectContaining({
        item: expect.objectContaining({ id: 'grid-broken-2' }),
        kind: 'generic',
        occurrenceKey: expect.any(String),
        surface: 'grid',
        url: 'https://example.com/grid-broken-2-preview.jpg',
      }),
    ])

    wrapper.unmount()
  })

  it('emits fullscreen asset failures with the classified error kind', async () => {
    setViewportWidth(390)
    vi.useFakeTimers()
    resolveVibeAssetErrorKindMock.mockResolvedValueOnce('not-found')

    const onAssetErrors = vi.fn()
    const wrapper = mount(Layout, {
      props: {
        items: [createImageItem('image-404', 'Missing image')],
        onAssetErrors,
      },
    })

    await wrapper.get('img').trigger('error')
    await flushDom()
    await vi.advanceTimersByTimeAsync(150)
    await flushDom()

    expect(onAssetErrors).toHaveBeenCalledTimes(1)
    expect(onAssetErrors.mock.calls[0][0]).toEqual([
      expect.objectContaining({
        item: expect.objectContaining({ id: 'image-404' }),
        kind: 'not-found',
        occurrenceKey: expect.any(String),
        surface: 'fullscreen',
        url: 'https://example.com/image-404.jpg',
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
