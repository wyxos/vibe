import type {
  VibeItem,
  VibeItemId,
  VibeMediaAsset,
} from '../types'

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
