import type {
  VibeItem,
  VibeMediaSource,
  VibeMediaVariant,
} from '../types'
import {
  clampMediaIndex,
  mediaAssets,
  mediaVariantForSource,
} from './mediaAsset'
import { isTimedMedia } from './mediaType'

export function replacementFeedVariant(
  item: VibeItem,
  mediaIndex: number,
  mediaSource: VibeMediaSource,
): VibeMediaVariant | null {
  const assets = mediaAssets(item)
  if (assets.length < 2) return null

  const currentIndex = clampMediaIndex(item, mediaIndex)
  const replacementIndex = currentIndex < assets.length - 1
    ? currentIndex + 1
    : currentIndex - 1
  const replacement = assets[replacementIndex]
  return replacement ? mediaVariantForSource(replacement, mediaSource) : null
}

export function preloadFeedVariant(variant: VibeMediaVariant): () => void {
  if (isTimedMedia(variant.type, variant.src)) {
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.preload = 'auto'
    video.src = variant.src
    video.load()
    return () => {
      video.pause()
      video.removeAttribute('src')
      video.load()
    }
  }

  const image = document.createElement('img')
  image.decoding = 'async'
  image.fetchPriority = 'low'
  image.src = variant.src
  void image.decode?.().catch(() => undefined)
  return () => {
    image.onload = null
    image.onerror = null
  }
}
