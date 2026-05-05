import type { VibeViewerItem } from '../viewer'

import { getListRenderableAsset, type VibeListRenderableAsset } from './listPreview'

export interface VibeFullscreenPreviewItem {
  asset: VibeListRenderableAsset
  index: number
  item: VibeViewerItem
}

export function getFullscreenNextPreviews(
  items: VibeViewerItem[],
  activeIndex: number,
  maxItems = 2,
): VibeFullscreenPreviewItem[] {
  return items
    .slice(activeIndex + 1, activeIndex + 1 + maxItems)
    .map((item, offset) => ({
      asset: getListRenderableAsset(item),
      index: activeIndex + offset + 1,
      item,
    }))
}
