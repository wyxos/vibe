import type { VibeViewerItem } from '../viewer'

const VIBE_OCCURRENCE_KEY = '__vibeOccurrenceKey'

export function getVibeOccurrenceKey(item: VibeViewerItem) {
  const occurrenceKey = item[VIBE_OCCURRENCE_KEY]
  return typeof occurrenceKey === 'string' && occurrenceKey.length > 0 ? occurrenceKey : item.id
}

export function reconcileVibeOccurrenceKeys(
  nextItems: VibeViewerItem[],
  previousItems: VibeViewerItem[],
  nextSequence: number,
) {
  const previousKeysById = new Map<string, string[]>()
  const resolvedItems: VibeViewerItem[] = []
  let sequence = nextSequence

  for (const item of previousItems) {
    const nextKeys = previousKeysById.get(item.id)
    const occurrenceKey = getVibeOccurrenceKey(item)

    if (nextKeys) {
      nextKeys.push(occurrenceKey)
    }
    else {
      previousKeysById.set(item.id, [occurrenceKey])
    }
  }

  for (const item of nextItems) {
    const existingKeys = previousKeysById.get(item.id)
    const nextKey = existingKeys?.shift() ?? `vibe-occurrence-${sequence += 1}`
    resolvedItems.push(withVibeOccurrenceKey(item, nextKey))
  }

  return {
    items: resolvedItems,
    nextSequence: sequence,
  }
}

function withVibeOccurrenceKey(item: VibeViewerItem, occurrenceKey: string) {
  if (getVibeOccurrenceKey(item) === occurrenceKey) {
    return item
  }

  return {
    ...item,
    [VIBE_OCCURRENCE_KEY]: occurrenceKey,
  }
}
