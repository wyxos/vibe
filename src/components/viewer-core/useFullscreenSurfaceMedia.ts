import type { Ref } from 'vue'

import type { VibeViewerItem } from '../viewer'
import { getVibeOccurrenceKey } from './itemIdentity'
import { getItemLabel } from './media'

const FULLSCREEN_PRELOAD_AHEAD_COUNT = 2

export function useFullscreenSurfaceMedia(options: {
  active: Ref<boolean | undefined>
  resolvedActiveIndex: Ref<number>
  viewer: {
    getAssetErrorKind: (id: string) => unknown
    getAssetErrorLabel: (id: string) => string | null | undefined
    getImageSource: (item: VibeViewerItem) => string | undefined
    isImageReady: (id: string) => boolean
    isMediaReady: (id: string) => boolean
  }
}) {
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
    const activeIndex = options.resolvedActiveIndex.value
    return Boolean(options.active.value) && index >= activeIndex && index <= activeIndex + FULLSCREEN_PRELOAD_AHEAD_COUNT
  }

  function isAssetLoading(index: number, item: VibeViewerItem) {
    const itemKey = getItemKey(item)

    if (!shouldPreloadSlideAsset(index) || index !== options.resolvedActiveIndex.value || options.viewer.getAssetErrorKind(itemKey)) {
      return false
    }

    if (item.type === 'image') {
      return !options.viewer.isImageReady(itemKey)
    }

    if (item.type === 'video' || item.type === 'audio') {
      return !options.viewer.isMediaReady(itemKey)
    }

    return false
  }

  function getAssetErrorKind(item: VibeViewerItem) {
    return options.viewer.getAssetErrorKind(getItemKey(item))
  }

  function getAssetErrorLabel(item: VibeViewerItem) {
    return options.viewer.getAssetErrorLabel(getItemKey(item)) ?? 'Load error'
  }

  function isAssetErrored(index: number, item: VibeViewerItem) {
    return shouldPreloadSlideAsset(index) && index === options.resolvedActiveIndex.value && Boolean(getAssetErrorKind(item))
  }

  function getFullscreenImageSource(index: number, item: VibeViewerItem) {
    return shouldPreloadSlideAsset(index) ? options.viewer.getImageSource(item) : undefined
  }

  function getFullscreenMediaSource(index: number, item: VibeViewerItem) {
    return shouldPreloadSlideAsset(index) ? item.url : undefined
  }

  return {
    getAssetErrorKind,
    getAssetErrorLabel,
    getFullscreenImageSource,
    getFullscreenMediaSource,
    getItemKey,
    getMediaActionLabel,
    isAssetErrored,
    isAssetLoading,
    shouldPreloadSlideAsset,
  }
}
