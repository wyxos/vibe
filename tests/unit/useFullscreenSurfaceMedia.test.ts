import { ref } from 'vue'
import { describe, expect, it } from 'vitest'

import type { VibeViewerItem } from '@/components/viewer'
import { useFullscreenSurfaceMedia } from '@/components/viewer-core/useFullscreenSurfaceMedia'

describe('useFullscreenSurfaceMedia', () => {
  it('preloads one previous slide and two ahead of the active slide', () => {
    const media = useFullscreenSurfaceMedia({
      active: ref(true),
      resolvedActiveIndex: ref(3),
      viewer: {
        getAssetErrorKind: () => null,
        getAssetErrorLabel: () => null,
        getImageSource: (item: VibeViewerItem) => item.url,
        isImageReady: () => false,
        isMediaReady: () => false,
      },
    })

    expect(media.shouldPreloadSlideAsset(1)).toBe(false)
    expect(media.shouldPreloadSlideAsset(2)).toBe(true)
    expect(media.shouldPreloadSlideAsset(3)).toBe(true)
    expect(media.shouldPreloadSlideAsset(4)).toBe(true)
    expect(media.shouldPreloadSlideAsset(5)).toBe(true)
    expect(media.shouldPreloadSlideAsset(6)).toBe(false)
  })
})
