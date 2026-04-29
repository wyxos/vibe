import type { VibeViewerItem } from '../viewer'

interface FullscreenAssetMediaController {
  getItemKey: (item: VibeViewerItem) => string
  settleAssetPreload: (id: string) => void
  shouldHandleSlideAssetEvent: (index: number, item: VibeViewerItem) => boolean
}

interface FullscreenAssetViewer {
  onImageError: (id: string, url: string) => Promise<void>
  onImageLoad: (id: string, url: string) => void
  onMediaError: (id: string, url: string) => Promise<void>
  onMediaEvent: (id: string, event: Event) => void
}

export function useFullscreenAssetEvents(options: {
  fullscreenMedia: FullscreenAssetMediaController
  updateDominantToneFromImageElement: (id: string, image: HTMLImageElement) => void
  viewer: FullscreenAssetViewer
}) {
  function getHandledItemKey(index: number, item: VibeViewerItem) {
    if (!options.fullscreenMedia.shouldHandleSlideAssetEvent(index, item)) {
      return null
    }

    return options.fullscreenMedia.getItemKey(item)
  }

  function onFullscreenImageLoad(event: Event, index: number, item: VibeViewerItem) {
    const id = getHandledItemKey(index, item)
    if (!id) {
      return
    }

    options.fullscreenMedia.settleAssetPreload(id)
    options.viewer.onImageLoad(id, item.url)
    const element = event.currentTarget
    if (element instanceof HTMLImageElement) {
      options.updateDominantToneFromImageElement(id, element)
    }
  }

  async function onFullscreenImageError(index: number, item: VibeViewerItem) {
    const id = getHandledItemKey(index, item)
    if (!id) {
      return
    }

    options.fullscreenMedia.settleAssetPreload(id)
    await options.viewer.onImageError(id, item.url)
  }

  function onFullscreenMediaEvent(index: number, item: VibeViewerItem, event: Event) {
    const id = getHandledItemKey(index, item)
    if (!id) {
      return null
    }

    options.viewer.onMediaEvent(id, event)
    return id
  }

  async function onFullscreenMediaError(index: number, item: VibeViewerItem) {
    const id = getHandledItemKey(index, item)
    if (!id) {
      return
    }

    options.fullscreenMedia.settleAssetPreload(id)
    await options.viewer.onMediaError(id, item.url)
  }

  return {
    getHandledItemKey,
    onFullscreenImageError,
    onFullscreenImageLoad,
    onFullscreenMediaError,
    onFullscreenMediaEvent,
  }
}
