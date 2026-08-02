import { watch, type WatchHandle } from 'vue'

import {
  collectItemPlacements,
  removePlacedItems,
  restoreItemPlacements,
} from './itemPlacement'
import type { VibeRuntimeState } from './runtime'
import type {
  VibeItem,
  VibeItemId,
  VibeItemPlacement,
  VibeRemoval,
} from '../types'

const DEFAULT_REMOVAL_HISTORY_LIMIT = 20

interface ItemRemovalControllerOptions {
  historyLimit?: number
  onItemsRemoved: (
    removal: VibeRemoval,
    placements: readonly VibeItemPlacement[],
    activeIndex: number,
  ) => void
  onRemovalRestored: (removal: VibeRemoval) => void
  startRemoval: (postIds: readonly VibeItemId[]) => number
  state: VibeRuntimeState
}

interface RemovalMetadata {
  generation: number
  restored: boolean
}

export class ItemRemovalController {
  private generation = 0
  private readonly historyLimit: number
  private readonly metadata = new WeakMap<VibeRemoval, RemovalMetadata>()
  private readonly state: VibeRuntimeState
  private history: VibeRemoval[] = []
  private itemOrder: VibeItemId[]
  private readonly stopItemsWatcher: WatchHandle

  constructor(private readonly options: ItemRemovalControllerOptions) {
    this.historyLimit = options.historyLimit ?? DEFAULT_REMOVAL_HISTORY_LIMIT
    this.state = options.state
    this.itemOrder = this.state.items.map(({ postId }) => postId)
    this.stopItemsWatcher = watch(
      () => this.state.items,
      (items) => this.appendUnknownItems(items),
      { flush: 'sync' },
    )
  }

  destroy(): void {
    this.reset()
    this.stopItemsWatcher()
  }

  async remove(postIds: readonly VibeItemId[]): Promise<VibeRemoval> {
    const placements = this.collectOrderedPlacements(postIds)
    const removal = this.createRemoval(placements)
    if (placements.length === 0) return removal

    const postIdsToRemove = placements.map(({ item }) => item.postId)
    const duration = this.options.startRemoval(postIdsToRemove)
    if (duration > 0) {
      await new Promise((resolve) => setTimeout(resolve, duration))
    }
    if (this.metadata.get(removal)?.generation !== this.generation) return removal

    const activeIndex = this.state.items.findIndex(
      (item) => item.postId === this.state.activeReelPostId,
    )
    const removedPostIdsSet = new Set(placements.map(({ item }) => item.postId))
    const removedBeforeActive = activeIndex < 0
      ? 0
      : this.state.items
          .slice(0, activeIndex)
          .filter(({ postId }) => removedPostIdsSet.has(postId))
          .length
    const forwardIndex = Math.max(activeIndex - removedBeforeActive, 0)
    this.state.items = removePlacedItems(this.state.items, placements)
    this.options.onItemsRemoved(removal, placements, forwardIndex)
    this.record(removal)
    return removal
  }

  reset(): void {
    this.generation += 1
    this.history = []
    this.itemOrder = []
  }

  restoreItems(placements: readonly VibeItemPlacement[]): void {
    const removal = placements as VibeRemoval
    if (this.metadata.has(removal)) {
      this.restoreRemoval(removal)
      return
    }

    const restored = restoreItemPlacements(this.state.items, placements)
    this.registerExternalPlacements(placements)
    this.state.items = restored
  }

  restoreRemoval(removal: VibeRemoval): boolean {
    const metadata = this.metadata.get(removal)
    if (!metadata) {
      throw new TypeError('Vibe removal does not belong to this instance.')
    }
    if (metadata.generation !== this.generation || metadata.restored) return false

    metadata.restored = true
    this.removeFromHistory(removal)
    const restored = this.restoreOrderedPlacements(removal)
    if (restored) this.options.onRemovalRestored(removal)
    return restored
  }

  undoLast(): VibeRemoval | null {
    while (this.history.length > 0) {
      const removal = this.history.pop()!
      if (this.restoreRemoval(removal)) return removal
    }

    return null
  }

  private appendUnknownItems(items: readonly VibeItem[]): void {
    const knownPostIds = new Set(this.itemOrder)
    items.forEach(({ postId }) => {
      if (knownPostIds.has(postId)) return
      this.itemOrder.push(postId)
      knownPostIds.add(postId)
    })
  }

  private collectOrderedPlacements(
    postIds: readonly VibeItemId[],
  ): VibeItemPlacement[] {
    const itemIndexes = new Map(
      this.itemOrder.map((postId, index) => [postId, index]),
    )

    return collectItemPlacements(this.state.items, postIds).map((placement) => ({
      index: itemIndexes.get(placement.item.postId) ?? placement.index,
      item: placement.item,
    }))
  }

  private createRemoval(placements: readonly VibeItemPlacement[]): VibeRemoval {
    const removal = Object.freeze(
      placements.map((placement) => Object.freeze({ ...placement })),
    ) as VibeRemoval
    this.metadata.set(removal, {
      generation: this.generation,
      restored: placements.length === 0,
    })
    return removal
  }

  private record(removal: VibeRemoval): void {
    if (this.historyLimit === 0) return
    this.history.push(removal)
    if (this.history.length > this.historyLimit) this.history.shift()
  }

  private registerExternalPlacements(
    placements: readonly VibeItemPlacement[],
  ): void {
    const knownPostIds = new Set(this.itemOrder)
    const orderedPlacements = [...placements].sort((left, right) => (
      left.index - right.index
    ))

    orderedPlacements.forEach(({ index, item }) => {
      if (knownPostIds.has(item.postId)) return
      this.itemOrder.splice(Math.min(index, this.itemOrder.length), 0, item.postId)
      knownPostIds.add(item.postId)
    })
  }

  private removeFromHistory(removal: VibeRemoval): void {
    const index = this.history.indexOf(removal)
    if (index >= 0) this.history.splice(index, 1)
  }

  private restoreOrderedPlacements(
    placements: readonly VibeItemPlacement[],
  ): boolean {
    const loadedPostIds = new Set(this.state.items.map(({ postId }) => postId))
    const missingItems = placements
      .map(({ item }) => item)
      .filter(({ postId }) => !loadedPostIds.has(postId))
    if (missingItems.length === 0) return false

    const itemIndexes = new Map(
      this.itemOrder.map((postId, index) => [postId, index]),
    )
    this.state.items = [...this.state.items, ...missingItems].sort((left, right) => (
      (itemIndexes.get(left.postId) ?? Number.MAX_SAFE_INTEGER)
      - (itemIndexes.get(right.postId) ?? Number.MAX_SAFE_INTEGER)
    ))
    return true
  }
}
