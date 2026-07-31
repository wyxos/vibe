import type {
  VibeItem,
  VibeItemId,
  VibeItemPlacement,
} from '../types'

export function collectItemPlacements(
  items: readonly VibeItem[],
  postIds: readonly VibeItemId[],
): VibeItemPlacement[] {
  const selectedPostIds = new Set(postIds)

  return items.flatMap((item, index) => (
    selectedPostIds.has(item.postId) ? [{ index, item }] : []
  ))
}

export function removePlacedItems(
  items: readonly VibeItem[],
  placements: readonly VibeItemPlacement[],
): VibeItem[] {
  const removedPostIds = new Set(placements.map(({ item }) => item.postId))
  return items.filter((item) => !removedPostIds.has(item.postId))
}

export function restoreItemPlacements(
  items: readonly VibeItem[],
  placements: readonly VibeItemPlacement[],
): VibeItem[] {
  placements.forEach(({ index }) => {
    if (!Number.isInteger(index) || index < 0) {
      throw new Error('Vibe item restore indexes must be non-negative integers.')
    }
  })

  const restored = [...items]
  const knownPostIds = new Set(items.map((item) => item.postId))
  const orderedPlacements = [...placements].sort((left, right) => left.index - right.index)

  orderedPlacements.forEach(({ index, item }) => {
    if (knownPostIds.has(item.postId)) return

    restored.splice(Math.min(index, restored.length), 0, item)
    knownPostIds.add(item.postId)
  })

  return restored
}
