import { nextTick, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'

import type { VibeViewerItem } from '@/components/viewer'
import { useFullscreenSurfaceMedia } from '@/components/viewer-core/useFullscreenSurfaceMedia'

describe('useFullscreenSurfaceMedia', () => {
  it('tracks the active slide, the next two slides, and the queued fourth slide through one preload state machine', () => {
    const items = ref([
      createImageItem('image-1'),
      createImageItem('image-2'),
      createImageItem('image-3'),
      createImageItem('image-4'),
      createImageItem('image-5'),
      createImageItem('image-6'),
    ])
    const viewer = createViewerStub()
    const media = useFullscreenSurfaceMedia({
      active: ref(true),
      items,
      resolvedActiveIndex: ref(2),
      viewer: viewer.api,
    })

    expect(media.getSlidePreloadState(1)).toBe('idle')
    expect(media.getSlidePreloadState(2)).toBe('loading')
    expect(media.getSlidePreloadState(3)).toBe('loading')
    expect(media.getSlidePreloadState(4)).toBe('loading')
    expect(media.getSlidePreloadState(5)).toBe('queued')
  })

  it('scenario 1: keeps a promoted pending active slide loading after the previous active slide had completed', async () => {
    const activeIndex = ref(2)
    const items = ref(createFullscreenItems())
    const viewer = createViewerStub()
    const media = useFullscreenSurfaceMedia({
      active: ref(true),
      items,
      resolvedActiveIndex: activeIndex,
      viewer: viewer.api,
    })

    viewer.setImageReady('image-3')
    media.settleAssetPreload('image-3')
    await flushDom()

    activeIndex.value = 3
    await flushDom()

    expect(media.getSlidePreloadState(3)).toBe('loading')
    expect(media.isAssetLoading(3, items.value[3])).toBe(true)
    expect(media.getSlidePreloadState(4)).toBe('loading')
    expect(media.getSlidePreloadState(5)).toBe('loading')
    expect(media.getSlidePreloadState(6)).toBe('queued')
  })

  it('scenario 2: renders the promoted active slide immediately when its fullscreen preload had already finished', async () => {
    const activeIndex = ref(2)
    const items = ref(createFullscreenItems())
    const viewer = createViewerStub()
    const media = useFullscreenSurfaceMedia({
      active: ref(true),
      items,
      resolvedActiveIndex: activeIndex,
      viewer: viewer.api,
    })

    viewer.setImageReady('image-3')
    media.settleAssetPreload('image-3')
    viewer.setImageReady('image-4')
    media.settleAssetPreload('image-4')
    await flushDom()

    activeIndex.value = 3
    await flushDom()

    expect(media.getSlidePreloadState(3)).toBe('ready')
    expect(media.isAssetLoading(3, items.value[3])).toBe(false)
    expect(media.getSlidePreloadState(4)).toBe('loading')
    expect(media.getSlidePreloadState(5)).toBe('loading')
    expect(media.getSlidePreloadState(6)).toBe('loading')
  })

  it('scenario 3: keeps the promoted active slide loading when neither the old active slide nor the promoted slide had finished', async () => {
    const activeIndex = ref(2)
    const items = ref(createFullscreenItems())
    const viewer = createViewerStub()
    const media = useFullscreenSurfaceMedia({
      active: ref(true),
      items,
      resolvedActiveIndex: activeIndex,
      viewer: viewer.api,
    })

    activeIndex.value = 3
    await flushDom()

    expect(media.getSlidePreloadState(3)).toBe('loading')
    expect(media.isAssetLoading(3, items.value[3])).toBe(true)
    expect(media.getSlidePreloadState(4)).toBe('loading')
    expect(media.getSlidePreloadState(5)).toBe('loading')
    expect(media.getSlidePreloadState(6)).toBe('queued')
  })

  it('scenario 4: renders the promoted active slide immediately when it had finished even though the old active slide had not', async () => {
    const activeIndex = ref(2)
    const items = ref(createFullscreenItems())
    const viewer = createViewerStub()
    const media = useFullscreenSurfaceMedia({
      active: ref(true),
      items,
      resolvedActiveIndex: activeIndex,
      viewer: viewer.api,
    })

    viewer.setImageReady('image-4')
    media.settleAssetPreload('image-4')
    await flushDom()

    activeIndex.value = 3
    await flushDom()

    expect(media.getSlidePreloadState(3)).toBe('ready')
    expect(media.isAssetLoading(3, items.value[3])).toBe(false)
    expect(media.getSlidePreloadState(4)).toBe('loading')
    expect(media.getSlidePreloadState(5)).toBe('loading')
    expect(media.getSlidePreloadState(6)).toBe('loading')
  })

  it('clears attached fullscreen preload state when fullscreen deactivates', async () => {
    const active = ref(true)
    const viewer = createViewerStub()
    const media = useFullscreenSurfaceMedia({
      active,
      items: ref([
        createImageItem('image-1'),
        createImageItem('image-2'),
        createImageItem('image-3'),
        createImageItem('image-4'),
      ]),
      resolvedActiveIndex: ref(0),
      viewer: viewer.api,
    })

    expect(media.getSlidePreloadState(0)).toBe('loading')
    expect(media.getSlidePreloadState(1)).toBe('loading')
    expect(media.getSlidePreloadState(2)).toBe('loading')
    expect(media.getSlidePreloadState(3)).toBe('queued')

    active.value = false
    await flushDom()

    expect(media.getSlidePreloadState(0)).toBe('idle')
    expect(media.getSlidePreloadState(1)).toBe('idle')
    expect(media.getSlidePreloadState(2)).toBe('idle')
    expect(media.getSlidePreloadState(3)).toBe('idle')
    expect(viewer.api.resetAssetState).toHaveBeenCalledWith('image-1')
    expect(viewer.api.resetAssetState).toHaveBeenCalledWith('image-2')
    expect(viewer.api.resetAssetState).toHaveBeenCalledWith('image-3')
  })
})

function createViewerStub() {
  const imageReadyStates: Record<string, boolean> = {}
  const mediaReadyStates: Record<string, boolean> = {}

  return {
    api: {
      getAssetErrorKind: () => null,
      getAssetErrorLabel: () => null,
      getImageSource: (item: VibeViewerItem) => item.url,
      isImageReady: (id: string) => Boolean(imageReadyStates[id]),
      isMediaReady: (id: string) => Boolean(mediaReadyStates[id]),
      resetAssetState: vi.fn(),
    },
    setImageReady(id: string, ready = true) {
      imageReadyStates[id] = ready
    },
    setMediaReady(id: string, ready = true) {
      mediaReadyStates[id] = ready
    },
  }
}

function createFullscreenItems() {
  return [
    createImageItem('image-1'),
    createImageItem('image-2'),
    createImageItem('image-3'),
    createImageItem('image-4'),
    createImageItem('image-5'),
    createImageItem('image-6'),
    createImageItem('image-7'),
    createImageItem('image-8'),
  ]
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
