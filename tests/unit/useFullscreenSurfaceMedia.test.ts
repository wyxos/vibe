import { nextTick, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'

import type { VibeViewerItem } from '@/components/viewer'
import { useFullscreenSurfaceMedia } from '@/components/viewer-core/useFullscreenSurfaceMedia'

describe('useFullscreenSurfaceMedia', () => {
  it('keeps the active slide immediate and preloads the next two items ahead of the forward queue', () => {
    const items = ref([
      createImageItem('image-1'),
      createImageItem('image-2'),
      createImageItem('image-3'),
      createImageItem('image-4'),
      createImageItem('image-5'),
      createImageItem('image-6'),
    ])
    const media = useFullscreenSurfaceMedia({
      active: ref(true),
      items,
      resolvedActiveIndex: ref(2),
      viewer: createViewerStub(),
    })

    expect(media.shouldPreloadSlideAsset(1)).toBe(false)
    expect(media.shouldPreloadSlideAsset(2)).toBe(true)
    expect(media.shouldPreloadSlideAsset(3)).toBe(true)
    expect(media.shouldPreloadSlideAsset(4)).toBe(true)
    expect(media.shouldPreloadSlideAsset(5)).toBe(false)

    media.settleBackgroundPreload('image-4')

    expect(media.shouldPreloadSlideAsset(5)).toBe(true)
  })

  it('drops stale previous work and keeps the forward pipeline hot as the active slide advances', async () => {
    const activeIndex = ref(2)
    const items = ref([
      createImageItem('image-1'),
      createImageItem('image-2'),
      createImageItem('image-3'),
      createImageItem('image-4'),
      createImageItem('image-5'),
      createImageItem('image-6'),
      createImageItem('image-7'),
      createImageItem('image-8'),
    ])
    const media = useFullscreenSurfaceMedia({
      active: ref(true),
      items,
      resolvedActiveIndex: activeIndex,
      viewer: createViewerStub(),
    })

    expect(media.shouldPreloadSlideAsset(2)).toBe(true)
    expect(media.shouldPreloadSlideAsset(1)).toBe(false)
    expect(media.shouldPreloadSlideAsset(3)).toBe(true)
    expect(media.shouldPreloadSlideAsset(4)).toBe(true)
    expect(media.shouldPreloadSlideAsset(5)).toBe(false)

    activeIndex.value = 3
    await flushDom()

    expect(media.shouldPreloadSlideAsset(2)).toBe(false)
    expect(media.shouldPreloadSlideAsset(4)).toBe(true)
    expect(media.shouldPreloadSlideAsset(5)).toBe(true)
    expect(media.shouldPreloadSlideAsset(6)).toBe(false)

    activeIndex.value = 4
    await flushDom()

    expect(media.shouldPreloadSlideAsset(3)).toBe(false)
    expect(media.shouldPreloadSlideAsset(5)).toBe(true)
    expect(media.shouldPreloadSlideAsset(6)).toBe(true)
    expect(media.shouldPreloadSlideAsset(7)).toBe(false)
  })

  it('clears active and neighbor asset state when fullscreen deactivates', async () => {
    const active = ref(true)
    const viewer = createViewerStub()
    const media = useFullscreenSurfaceMedia({
      active,
      items: ref([
        createImageItem('image-1'),
        createImageItem('image-2'),
        createImageItem('image-3'),
      ]),
      resolvedActiveIndex: ref(0),
      viewer,
    })

    expect(media.shouldPreloadSlideAsset(0)).toBe(true)
    expect(media.shouldPreloadSlideAsset(1)).toBe(true)

    active.value = false
    await flushDom()

    expect(viewer.resetAssetState).toHaveBeenCalledWith('image-1')
    expect(viewer.resetAssetState).toHaveBeenCalledWith('image-2')
  })
})

function createViewerStub() {
  return {
    getAssetErrorKind: () => null,
    getAssetErrorLabel: () => null,
    getImageSource: (item: VibeViewerItem) => item.url,
    isImageReady: () => false,
    isMediaReady: () => false,
    resetAssetState: vi.fn(),
  }
}

function createImageItem(id: string): VibeViewerItem {
  return {
    id,
    type: 'image',
    url: `https://example.com/${id}.jpg`,
  }
}

async function flushDom() {
  await nextTick()
  await Promise.resolve()
  await nextTick()
}
