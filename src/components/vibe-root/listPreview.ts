import type { VibeViewerItem } from '../vibeViewer'

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

export function getListRenderableAsset(item: VibeViewerItem): VibeListRenderableAsset {
  const sourceUrl = item.preview?.url ?? item.url
  const dimensions = getMasonryDimensions(item)
  const label = item.title?.trim() || getItemLabel(item.type)

  if (item.type !== 'image' && item.type !== 'video') {
    return {
      kind: 'fallback',
      url: null,
      width: dimensions.width,
      height: dimensions.height,
      label,
    }
  }

  if (isVideoPreview(item, sourceUrl)) {
    return {
      kind: 'video',
      url: sourceUrl,
      width: dimensions.width,
      height: dimensions.height,
      label,
    }
  }

  if (isImagePreview(item, sourceUrl)) {
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

function isImagePreview(item: VibeViewerItem, url: string | undefined) {
  if (item.type !== 'image' || typeof url !== 'string') {
    return false
  }

  return IMAGE_URL_PATTERN.test(url) || isLikelyHttpAsset(url)
}

function isVideoPreview(item: VibeViewerItem, url: string | undefined) {
  return item.type === 'video' && typeof url === 'string' && VIDEO_URL_PATTERN.test(url)
}

function isLikelyHttpAsset(url: string) {
  return /^https?:\/\//i.test(url)
}
