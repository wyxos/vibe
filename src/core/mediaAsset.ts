import type {
  VibeItem,
  VibeItemId,
  VibeMediaAsset,
  VibeMediaSource,
  VibeMediaVariant,
} from '../types'

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
  if (source === 'preview') {
    return { ...asset.preview, type: asset.preview.type ?? asset.type }
  }
  if (source === 'mobile' && asset.mobile) {
    return { ...asset.mobile, type: asset.mobile.type ?? asset.type }
  }
  return originalVariant(asset)
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
