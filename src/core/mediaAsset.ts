import type {
  VibeItem,
  VibeItemId,
  VibeMediaAsset,
  VibeMediaSource,
  VibeMediaVariant,
} from '../types'
import { resolveMediaType } from './mediaType'

function originalVariant(asset: VibeMediaAsset): VibeMediaVariant {
  return {
    height: asset.height,
    src: asset.src,
    type: asset.type,
    width: asset.width,
  }
}

export function mediaVariantForSource(
  asset: VibeMediaAsset,
  source: VibeMediaSource,
): VibeMediaVariant {
  if (source === 'preview' && asset.preview) {
    const type = resolveMediaType(asset.type, asset.src) === 'audio'
      ? resolveMediaType(asset.preview.type, asset.preview.src)
      : asset.preview.type ?? asset.type
    return { ...asset.preview, type }
  }
  if (source === 'mobile' && asset.mobile) {
    return { ...asset.mobile, type: asset.mobile.type ?? asset.type }
  }
  return originalVariant(asset)
}

export function audioCoverVariant(
  asset: VibeMediaAsset,
): VibeMediaVariant | null {
  const preview = asset.preview
  if (!preview?.src || preview.src === asset.src) return null
  if (resolveMediaType(preview.type, preview.src) !== 'image') return null
  return { ...preview, type: 'image' }
}

export function mediaPlaybackVariantForSource(
  asset: VibeMediaAsset,
  source: VibeMediaSource,
): VibeMediaVariant {
  if (resolveMediaType(asset.type, asset.src) !== 'audio') {
    return mediaVariantForSource(asset, source)
  }
  if (source === 'mobile' && asset.mobile
    && resolveMediaType(asset.mobile.type, asset.mobile.src) === 'audio') {
    return { ...asset.mobile, type: 'audio' }
  }
  return { ...originalVariant(asset), type: 'audio' }
}

export function mediaAssets(item: VibeItem): readonly VibeMediaAsset[] {
  return [item, ...item.items]
}

export function clampMediaIndex(item: VibeItem, index: number): number {
  return Math.min(item.items.length, Math.max(0, index))
}

export function mediaAssetAt(item: VibeItem, index: number): VibeMediaAsset {
  return mediaAssets(item)[clampMediaIndex(item, index)] ?? item
}

export function mediaStateKey(postId: VibeItemId, mediaIndex: number): string {
  return `${String(postId)}:${mediaIndex}`
}
