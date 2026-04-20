import type { Ref } from 'vue'

import type { VibeViewerItem } from '../viewer'
import { getVibeOccurrenceKey } from './itemIdentity'
import { getItemLabel } from './media'
import { useFullscreenPreloadController } from './useFullscreenPreloadController'

export function useFullscreenSurfaceMedia(options: {
  active: Ref<boolean | undefined>
  items: Ref<VibeViewerItem[]>
  resolvedActiveIndex: Ref<number>
  viewer: {
    getAssetErrorKind: (id: string) => unknown
    getAssetErrorLabel: (id: string) => string | null | undefined
    getImageSource: (item: VibeViewerItem) => string | undefined
    isImageReady: (id: string) => boolean
    isMediaReady: (id: string) => boolean
    resetAssetState: (id: string) => void
  }
}) {
  const preloadController = useFullscreenPreloadController({
    active: options.active,
    getItemKey,
    isAssetReady,
    items: options.items,
    onResetAssetState: options.viewer.resetAssetState,
    resolvedActiveIndex: options.resolvedActiveIndex,
  })

  function getMediaActionLabel(action: 'Play' | 'Pause', item: VibeViewerItem) {
    const label = item.title?.trim()
    if (label) {
      return `${action} ${label}`
    }

    return `${action} ${getItemLabel(item.type).toLowerCase()}`
  }

  function getItemKey(item: VibeViewerItem) {
    return getVibeOccurrenceKey(item)
  }

  function shouldPreloadSlideAsset(index: number) {
    return preloadController.shouldAttachSlideAsset(index)
  }

  function getSlidePreloadState(index: number) {
    return preloadController.getSlidePreloadState(index)
  }

  function isAssetLoading(index: number, item: VibeViewerItem) {
    const itemKey = getItemKey(item)
    const preloadState = getSlidePreloadState(index)

    if ((preloadState === 'idle')
      || index !== options.resolvedActiveIndex.value
      || options.viewer.getAssetErrorKind(itemKey)) {
      return false
    }

    return preloadState !== 'ready'
  }

  function getAssetErrorKind(item: VibeViewerItem) {
    return options.viewer.getAssetErrorKind(getItemKey(item))
  }

  function getAssetErrorLabel(item: VibeViewerItem) {
    return options.viewer.getAssetErrorLabel(getItemKey(item)) ?? 'Load error'
  }

  function isAssetErrored(index: number, item: VibeViewerItem) {
    return getSlidePreloadState(index) !== 'idle' && index === options.resolvedActiveIndex.value && Boolean(getAssetErrorKind(item))
  }

  function getFullscreenImageSource(index: number, item: VibeViewerItem) {
    return shouldPreloadSlideAsset(index) ? options.viewer.getImageSource(item) : undefined
  }

  function getFullscreenMediaPreload(index: number) {
    return shouldPreloadSlideAsset(index) ? 'metadata' : 'none'
  }

  function getFullscreenMediaSource(index: number, item: VibeViewerItem) {
    return shouldPreloadSlideAsset(index) ? item.url : undefined
  }

  function isAssetReady(id: string, item: VibeViewerItem) {
    if (item.type === 'image') {
      return options.viewer.isImageReady(id)
    }

    if (item.type === 'video' || item.type === 'audio') {
      return options.viewer.isMediaReady(id)
    }

    return false
  }

  return {
    getAssetErrorKind,
    getAssetErrorLabel,
    getFullscreenImageSource,
    getFullscreenMediaPreload,
    getFullscreenMediaSource,
    getItemKey,
    getMediaActionLabel,
    getSlidePreloadState,
    isAssetErrored,
    isAssetLoading,
    registerImageElement: preloadController.registerImageElement,
    registerMediaElement: preloadController.registerMediaElement,
    settleAssetPreload: preloadController.settleAssetPreload,
    shouldPreloadSlideAsset,
  }
}
