import { nextTick, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'

import type { VibeViewerItem } from '@/components/viewer'
import { useFullscreenSurfaceMedia } from '@/components/viewer-core/useFullscreenSurfaceMedia'

describe('useFullscreenSurfaceMedia', () => {
  it('grants the active slide immediately and queues fullscreen neighbors in order', () => {
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
      resolvedActiveIndex: ref(3),
      viewer: createViewerStub(),
    })

    expect(media.shouldPreloadSlideAsset(2)).toBe(false)
    expect(media.shouldPreloadSlideAsset(3)).toBe(true)
    expect(media.shouldPreloadSlideAsset(4)).toBe(true)
    expect(media.shouldPreloadSlideAsset(5)).toBe(false)

    media.settleBackgroundPreload('image-5')

    expect(media.shouldPreloadSlideAsset(5)).toBe(true)
    expect(media.shouldPreloadSlideAsset(2)).toBe(false)

    media.settleBackgroundPreload('image-6')

    expect(media.shouldPreloadSlideAsset(2)).toBe(true)
  })

  it('keeps unfinished next preloads alive on swipe and extends the queue forward', async () => {
    const activeIndex = ref(2)
    const items = ref([
      createImageItem('image-1'),
      createImageItem('image-2'),
      createImageItem('image-3'),
      createImageItem('image-4'),
      createImageItem('image-5'),
      createImageItem('image-6'),
      createImageItem('image-7'),
    ])
    const media = useFullscreenSurfaceMedia({
      active: ref(true),
      items,
      resolvedActiveIndex: activeIndex,
      viewer: createViewerStub(),
    })

    expect(media.shouldPreloadSlideAsset(2)).toBe(true)
    expect(media.shouldPreloadSlideAsset(3)).toBe(true)
    expect(media.shouldPreloadSlideAsset(4)).toBe(false)
    expect(media.shouldPreloadSlideAsset(5)).toBe(false)

    activeIndex.value = 3
    await flushDom()

    expect(media.shouldPreloadSlideAsset(2)).toBe(true)
    expect(media.shouldPreloadSlideAsset(3)).toBe(true)
    expect(media.shouldPreloadSlideAsset(4)).toBe(true)
    expect(media.shouldPreloadSlideAsset(5)).toBe(false)
    expect(media.shouldPreloadSlideAsset(6)).toBe(false)

    media.settleBackgroundPreload('image-5')

    expect(media.shouldPreloadSlideAsset(5)).toBe(true)
    expect(media.shouldPreloadSlideAsset(6)).toBe(false)

    media.settleBackgroundPreload('image-6')

    expect(media.shouldPreloadSlideAsset(6)).toBe(true)
    expect(media.shouldPreloadSlideAsset(2)).toBe(true)
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
