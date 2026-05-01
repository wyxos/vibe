import { shallowRef, triggerRef } from 'vue'

import type { VibeViewerItem } from '../viewer'
import {
  appendMasonryLayoutItems,
  buildMasonryLayout,
  canAppendMasonryLayout,
  type LayoutPosition,
  type VibeMasonryLayoutResult,
} from './masonryLayout'
import type { MasonryRemovedItem } from './masonryItemMutation'

export function useMasonryLayoutState(options: {
  bucketPx: number
  contentInsetPx: number
  gapPx: number
}) {
  const positions = shallowRef<LayoutPosition[]>([])
  const heights = shallowRef<number[]>([])
  const buckets = shallowRef<Map<number, number[]>>(new Map())
  const contentHeight = shallowRef(0)
  const indexById = shallowRef<Map<string, number>>(new Map())
  const columnHeights = shallowRef<number[]>([])

  function rebuild(items: VibeViewerItem[], columnCount: number, columnWidth: number) {
    const nextLayout = buildMasonryLayout(items, {
      columnCount,
      columnWidth,
      gapX: options.gapPx,
      gapY: options.gapPx,
      bucketPx: options.bucketPx,
    })

    positions.value = nextLayout.positions.map(offsetPosition)
    heights.value = nextLayout.heights
    buckets.value = nextLayout.buckets
    contentHeight.value = nextLayout.contentHeight
    indexById.value = nextLayout.indexById
    columnHeights.value = nextLayout.columnHeights
  }

  function append(items: VibeViewerItem[], startIndex: number, columnCount: number, columnWidth: number) {
    const nextLayout = appendMasonryLayoutItems(getMutableLayout(), items, {
      columnCount,
      columnWidth,
      gapX: options.gapPx,
      gapY: options.gapPx,
      bucketPx: options.bucketPx,
      startIndex,
      positionOffsetX: options.contentInsetPx,
      positionOffsetY: options.contentInsetPx,
    })

    contentHeight.value = nextLayout.contentHeight
    triggerRef(positions)
    triggerRef(heights)
    triggerRef(buckets)
    triggerRef(indexById)
    triggerRef(columnHeights)
  }

  function canAppend(
    currentItems: VibeViewerItem[],
    previousItems: VibeViewerItem[],
    mutation: { addedItems: VibeViewerItem[], isPrepend: boolean, removedItems: MasonryRemovedItem[] },
    columnCount: number,
  ) {
    return canAppendMasonryLayout({
      addedItems: mutation.addedItems,
      columnCount,
      columnHeights: columnHeights.value,
      currentItems,
      isPrepend: mutation.isPrepend,
      layoutItemCount: positions.value.length,
      previousItems,
      removedItemCount: mutation.removedItems.length,
    })
  }

  function getMutableLayout(): VibeMasonryLayoutResult {
    return {
      positions: positions.value,
      heights: heights.value,
      buckets: buckets.value,
      contentHeight: contentHeight.value,
      indexById: indexById.value,
      columnHeights: columnHeights.value,
    }
  }

  function offsetPosition(position: LayoutPosition): LayoutPosition {
    return {
      x: position.x + options.contentInsetPx,
      y: position.y + options.contentInsetPx,
    }
  }

  return {
    append,
    buckets,
    canAppend,
    columnHeights,
    contentHeight,
    heights,
    indexById,
    positions,
    rebuild,
  }
}
