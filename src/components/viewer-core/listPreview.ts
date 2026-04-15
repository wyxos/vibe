import type { VibeViewerAsset, VibeViewerItem } from '../viewer'

import { getItemLabel } from './media'
import { getMasonryDimensions } from './masonryLayout'

export type VibeListRenderableKind = 'image' | 'video' | 'fallback'

export interface VibeListRenderableAsset {
  kind: VibeListRenderableKind
  url: string | null
  width: number
  height: number
  label: string
}

const IMAGE_URL_PATTERN = /\.(avif|gif|jpe?g|png|svg|webp)(\?|#|$)/i
const VIDEO_URL_PATTERN = /\.(m4v|mov|mp4|mpeg|ogg|ogv|webm)(\?|#|$)/i
const ATLAS_VIDEO_ASSET_PATH_PATTERN = /^(?:(?:https?:)?\/\/[^/]+)?\/api\/files\/[^/?#]+\/(?:preview|downloaded)(?:\?|#|$)/i

export function getListRenderableAsset(item: VibeViewerItem): VibeListRenderableAsset {
  const sourceAsset = resolveSourceAsset(item)
  const sourceUrl = sourceAsset?.url
  const dimensions = getMasonryDimensions(item)
  const label = item.title?.trim() || getItemLabel(item.type)

  if (sourceAsset?.mediaType === 'video' && typeof sourceUrl === 'string') {
    return {
      kind: 'video',
      url: sourceUrl,
      width: dimensions.width,
      height: dimensions.height,
      label,
    }
  }

  if (sourceAsset?.mediaType === 'image' && typeof sourceUrl === 'string') {
    return {
      kind: 'image',
      url: sourceUrl,
      width: dimensions.width,
      height: dimensions.height,
      label,
    }
  }

  if (item.type !== 'image' && item.type !== 'video') {
    return {
      kind: 'fallback',
      url: null,
      width: dimensions.width,
      height: dimensions.height,
      label,
    }
  }

  if (typeof sourceUrl === 'string' && isVideoPreview(item, sourceUrl)) {
    return {
      kind: 'video',
      url: sourceUrl,
      width: dimensions.width,
      height: dimensions.height,
      label,
    }
  }

  if (typeof sourceUrl === 'string' && isImagePreview(item, sourceUrl)) {
    return {
      kind: 'image',
      url: sourceUrl,
      width: dimensions.width,
      height: dimensions.height,
      label,
    }
  }

  return {
    kind: 'fallback',
    url: null,
    width: dimensions.width,
    height: dimensions.height,
    label,
  }
}

function resolveSourceAsset(item: VibeViewerItem): VibeViewerAsset | null {
  if (item.preview?.url) {
    return item.preview
  }

  if (typeof item.url !== 'string' || item.url.trim() === '') {
    return null
  }

  return {
    url: item.url,
  }
}

function isImagePreview(item: VibeViewerItem, url: string | undefined) {
  if (item.type !== 'image' || typeof url !== 'string') {
    return false
  }

  return IMAGE_URL_PATTERN.test(url) || isLikelyRenderableImageAsset(url)
}

function isVideoPreview(item: VibeViewerItem, url: string | undefined) {
  if (item.type !== 'video' || typeof url !== 'string') {
    return false
  }

  return VIDEO_URL_PATTERN.test(url) || isLikelyRenderableVideoAsset(url)
}

function isLikelyRenderableImageAsset(url: string) {
  return /^(https?:\/\/|\/\/|\/(?!\/)|\.{1,2}\/|blob:|data:)/i.test(url)
}

function isLikelyRenderableVideoAsset(url: string) {
  return ATLAS_VIDEO_ASSET_PATH_PATTERN.test(url) || /^blob:/i.test(url) || /^data:video\//i.test(url)
}
