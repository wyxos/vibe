import { nextTick, type Ref, type ComputedRef } from 'vue'

export interface UseMasonryItemsOptions {
  masonry: Ref<any[]>
  useSwipeMode: ComputedRef<boolean>
  refreshLayout: (items: any[]) => void
  refreshCurrentPage: () => Promise<any>
  loadNext: () => Promise<any>
  maybeBackfillToTarget: (baseline: number, force?: boolean) => Promise<void>
  autoRefreshOnEmpty: boolean
  paginationHistory: Ref<any[]>
}

export function useMasonryItems(options: UseMasonryItemsOptions) {
  const {
    masonry,
    useSwipeMode,
    refreshLayout,
    refreshCurrentPage,
    loadNext,
    maybeBackfillToTarget,
    autoRefreshOnEmpty,
    paginationHistory
  } = options

  // Batch remove operations to prevent visual glitches from rapid successive calls
  let pendingRemoves = new Set<any>()
  let removeTimeoutId: ReturnType<typeof setTimeout> | null = null
  let isProcessingRemoves = false

  async function processPendingRemoves() {
    if (pendingRemoves.size === 0 || isProcessingRemoves) return

    isProcessingRemoves = true
    const itemsToRemove = Array.from(pendingRemoves)
    pendingRemoves.clear()
    removeTimeoutId = null

    // Use removeManyInternal for batched removal (bypass batching to avoid recursion)
    await removeManyInternal(itemsToRemove)
    isProcessingRemoves = false
  }

  async function remove(item: any) {
    // Add to pending removes
    pendingRemoves.add(item)

    // Clear existing timeout
    if (removeTimeoutId) {
      clearTimeout(removeTimeoutId)
    }

    // Batch removes within a short time window (16ms = ~1 frame at 60fps)
    removeTimeoutId = setTimeout(() => {
      processPendingRemoves()
    }, 16)
  }

  async function removeManyInternal(items: any[]) {
    if (!items || items.length === 0) return
    const ids = new Set(items.map(i => i.id))
    const next = masonry.value.filter(i => !ids.has(i.id))
    masonry.value = next
    await nextTick()

    // If all items were removed, either refresh current page or load next based on prop
    if (next.length === 0 && paginationHistory.value.length > 0) {
      if (autoRefreshOnEmpty) {
        await refreshCurrentPage()
      } else {
        try {
          await loadNext()
          // Force backfill from 0 to ensure viewport is filled
          await maybeBackfillToTarget(0, true)
        } catch { }
      }
      return
    }

    // Commit DOM updates without forcing sync reflow
    await new Promise<void>(r => requestAnimationFrame(() => r()))
    // Start FLIP on next frame
    requestAnimationFrame(() => {
      refreshLayout(next)
    })
  }

  async function removeMany(items: any[]) {
    if (!items || items.length === 0) return

    // Add all items to pending removes for batching
    items.forEach(item => pendingRemoves.add(item))

    // Clear existing timeout
    if (removeTimeoutId) {
      clearTimeout(removeTimeoutId)
    }

    // Batch removes within a short time window (16ms = ~1 frame at 60fps)
    removeTimeoutId = setTimeout(() => {
      processPendingRemoves()
    }, 16)
  }

  /**
   * Restore a single item at its original index.
   * This is useful for undo operations where an item needs to be restored to its exact position.
   * Handles all index calculation and layout recalculation internally.
   * @param item - Item to restore
   * @param index - Original index of the item
   */
  async function restore(item: any, index: number) {
    if (!item) return

    const current = masonry.value
    const existingIndex = current.findIndex(i => i.id === item.id)
    if (existingIndex !== -1) return // Item already exists

    // Insert at the original index (clamped to valid range)
    const newItems = [...current]
    const targetIndex = Math.min(index, newItems.length)
    newItems.splice(targetIndex, 0, item)

    // Update the masonry array
    masonry.value = newItems
    await nextTick()

    // Trigger layout recalculation (same pattern as remove)
    if (!useSwipeMode.value) {
      // Commit DOM updates without forcing sync reflow
      await new Promise<void>(r => requestAnimationFrame(() => r()))
      // Start FLIP on next frame
      requestAnimationFrame(() => {
        refreshLayout(newItems)
      })
    }
  }

  /**
   * Restore multiple items at their original indices.
   * This is useful for undo operations where items need to be restored to their exact positions.
   * Handles all index calculation and layout recalculation internally.
   * @param items - Array of items to restore
   * @param indices - Array of original indices for each item (must match items array length)
   */
  async function restoreMany(items: any[], indices: number[]) {
    if (!items || items.length === 0) return
    if (!indices || indices.length !== items.length) {
      console.warn('[Masonry] restoreMany: items and indices arrays must have the same length')
      return
    }

    const current = masonry.value
    const existingIds = new Set(current.map(i => i.id))

    // Filter out items that already exist and pair with their indices
    const itemsToRestore: Array<{ item: any; index: number }> = []
    for (let i = 0; i < items.length; i++) {
      if (!existingIds.has(items[i]?.id)) {
        itemsToRestore.push({ item: items[i], index: indices[i] })
      }
    }

    if (itemsToRestore.length === 0) return

    // Build the final array by merging current items and restored items
    // Strategy: Build position by position - for each position, decide if it should be
    // a restored item (at its original index) or a current item (accounting for shifts)

    // Create a map of restored items by their original index for O(1) lookup
    const restoredByIndex = new Map<number, any>()
    for (const { item, index } of itemsToRestore) {
      restoredByIndex.set(index, item)
    }

    // Find the maximum position we need to consider
    const maxRestoredIndex = itemsToRestore.length > 0
      ? Math.max(...itemsToRestore.map(({ index }) => index))
      : -1
    const maxPosition = Math.max(current.length - 1, maxRestoredIndex)

    // Build the final array position by position
    // Key insight: Current array items are in "shifted" positions (missing the removed items).
    // When we restore items at their original positions, current items naturally shift back.
    // We can build the final array by iterating positions and using items sequentially.
    const newItems: any[] = []
    let currentArrayIndex = 0 // Track which current item we should use next

    // Iterate through all positions up to the maximum we need
    for (let position = 0; position <= maxPosition; position++) {
      // If there's a restored item that belongs at this position, use it
      if (restoredByIndex.has(position)) {
        newItems.push(restoredByIndex.get(position)!)
      } else {
        // Otherwise, this position should be filled by the next current item
        // Since current array is missing restored items, items are shifted left.
        // By using them sequentially, they naturally end up in the correct positions.
        if (currentArrayIndex < current.length) {
          newItems.push(current[currentArrayIndex])
          currentArrayIndex++
        }
      }
    }

    // Add any remaining current items that come after the last restored position
    // (These are items that were originally after maxRestoredIndex)
    while (currentArrayIndex < current.length) {
      newItems.push(current[currentArrayIndex])
      currentArrayIndex++
    }

    // Update the masonry array
    masonry.value = newItems
    await nextTick()

    // Trigger layout recalculation (same pattern as removeMany)
    if (!useSwipeMode.value) {
      // Commit DOM updates without forcing sync reflow
      await new Promise<void>(r => requestAnimationFrame(() => r()))
      // Start FLIP on next frame
      requestAnimationFrame(() => {
        refreshLayout(newItems)
      })
    }
  }

  async function removeAll() {
    // Clear all items
    masonry.value = []
  }

  return {
    remove,
    removeMany,
    restore,
    restoreMany,
    removeAll
  }
}

