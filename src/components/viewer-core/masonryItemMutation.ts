import type { VibeViewerItem } from '../viewer'
import { getVibeOccurrenceKey } from './itemIdentity'

export interface MasonryRemovedItem {
  height: number
  item: VibeViewerItem
  position: { x: number, y: number }
}

export function getMasonryItemMutation(options: {
  activeIndex: number
  currentItems: VibeViewerItem[]
  gapPx: number
  contentInsetPx: number
  layoutHeights: number[]
  layoutIndexById: Map<string, number>
  layoutPositions: { x: number, y: number }[]
  previousItems: VibeViewerItem[]
  scrollTop: number
}) {
  const currentIds = options.currentItems.map((item) => getVibeOccurrenceKey(item))
  const previousIds = options.previousItems.map((item) => getVibeOccurrenceKey(item))
  const oldHeightsById = snapshotHeightsById(options.previousItems, options.layoutIndexById, options.layoutHeights)
  const oldPositionsById = snapshotPositionsById(options.previousItems, options.layoutIndexById, options.layoutPositions)
  const previousIdSet = new Set(previousIds)
  const currentIdSet = new Set(currentIds)
  const addedItems = options.currentItems.filter((item) => !previousIdSet.has(getVibeOccurrenceKey(item)))
  const removedItems = getRemovedItems(options.previousItems, currentIdSet, oldHeightsById, oldPositionsById)
  const isPrepend = currentIds.length > previousIds.length && previousIds.length > 0 && currentIds[0] !== previousIds[0]
  const beyondTopEdge = options.scrollTop > options.contentInsetPx + options.gapPx
  const anchorItem = isPrepend && beyondTopEdge ? options.currentItems[options.activeIndex] : null

  return {
    addedItems,
    anchorId: anchorItem ? getVibeOccurrenceKey(anchorItem) : null,
    isPrepend,
    oldPositionsById,
    previousIds,
    removedItems,
    shouldLockBoundaryInteractionForRemoval: removedItems.length > 0 && beyondTopEdge,
    shouldResetScrollForEmptyRemoval: options.currentItems.length === 0
      && options.previousItems.length > 0
      && removedItems.length > 0
      && options.scrollTop > 0,
  }
}

function getRemovedItems(
  previousItems: VibeViewerItem[],
  currentIdSet: Set<string>,
  oldHeightsById: Map<string, number>,
  oldPositionsById: Map<string, { x: number, y: number }>,
) {
  return previousItems.flatMap((item): MasonryRemovedItem[] => {
    const itemId = getVibeOccurrenceKey(item)

    if (currentIdSet.has(itemId)) {
      return []
    }

    const position = oldPositionsById.get(itemId)
    const height = oldHeightsById.get(itemId)

    return position && height != null ? [{ height, item, position }] : []
  })
}

function snapshotHeightsById(
  items: VibeViewerItem[],
  indexById: Map<string, number>,
  layoutHeights: number[],
) {
  const snapshot = new Map<string, number>()

  for (const item of items) {
    const itemId = getVibeOccurrenceKey(item)
    const index = indexById.get(itemId)
    const height = index == null ? undefined : layoutHeights[index]

    if (height != null) {
      snapshot.set(itemId, height)
    }
  }

  return snapshot
}

function snapshotPositionsById(
  items: VibeViewerItem[],
  indexById: Map<string, number>,
  layoutPositions: { x: number, y: number }[],
) {
  const snapshot = new Map<string, { x: number, y: number }>()

  for (const item of items) {
    const itemId = getVibeOccurrenceKey(item)
    const index = indexById.get(itemId)
    const position = index == null ? undefined : layoutPositions[index]

    if (position) {
      snapshot.set(itemId, position)
    }
  }

  return snapshot
}
