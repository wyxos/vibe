import { mediaAssets } from './mediaAsset'
import type { VibeRuntimeState } from './runtime'
import type { VibeItem, VibeItemId } from '../types'

function itemKey(id: VibeItemId): string {
  return String(id)
}

function clampStoredMediaIndex(state: VibeRuntimeState, item: VibeItem): void {
  const count = mediaAssets(item).length
  const current = state.mediaIndices.get(item.postId) ?? 0
  if (current >= count) state.mediaIndices.set(item.postId, Math.max(0, count - 1))
}

export function applyItemUpdates(
  state: VibeRuntimeState,
  items: readonly VibeItem[],
): VibeItemId[] {
  const incoming = new Map<string, VibeItem>()
  items.forEach((item) => incoming.set(itemKey(item.postId), item))
  if (incoming.size === 0) return []

  const updated: VibeItemId[] = []
  const nextItems = state.items.map((current) => {
    const replacement = incoming.get(itemKey(current.postId))
    if (!replacement) return current

    const next = { ...replacement, postId: current.postId }
    clampStoredMediaIndex(state, next)
    if (state.reelForwardItem && itemKey(state.reelForwardItem.postId) === itemKey(current.postId)) {
      state.reelForwardItem = next
    }
    updated.push(current.postId)
    return next
  })

  if (updated.length > 0) state.items = nextItems
  return updated
}
