import { reactive } from 'vue'
import type { VibeItem, VibeItemId } from '../types'
import type {
  VibeInteractionMode, VibeOrderingOptions, VibeReorderPosition,
  VibeSelectionOptions, VibeSelectionSnapshot, VibeSelectionState,
} from '../selection'

interface SelectionControllerOptions {
  selection?: boolean | VibeSelectionOptions
  ordering?: VibeOrderingOptions
  getItems: () => readonly VibeItem[]
  setItems: (items: VibeItem[]) => void
  /** Must change on collection replacement, but not ordinary pagination. */
  getCollectionKey?: () => unknown
}

const key = (id: VibeItemId): string => String(id)

export class VibeSelectionController {
  readonly state: VibeSelectionState
  readonly enabled: boolean
  readonly canArrange: boolean
  readonly selectionOptions: VibeSelectionOptions
  private selected = new Map<string, VibeItemId>()
  private labels = new Map<string, string>()
  private pending: AbortController | null = null
  private retryOperation: (() => Promise<boolean>) | null = null
  private cachedItems: readonly VibeItem[] | null = null
  private cachedLength = -1
  private cachedIndex = new Map<string, VibeItem>()
  private destroyed = false

  constructor(private readonly options: SelectionControllerOptions) {
    this.enabled = Boolean(options.selection)
    this.canArrange = Boolean(options.ordering)
    this.selectionOptions = typeof options.selection === 'object' ? options.selection : {}
    this.state = reactive({ selectedIds: [], count: 0, mode: 'browse', busy: false, error: null })
    if (this.enabled) this.set(this.selectionOptions.initialIds ?? [], false)
  }

  getSelection(): VibeSelectionSnapshot {
    return Object.freeze({ selectedIds: Object.freeze([...this.state.selectedIds]), count: this.state.count })
  }

  isSelected(id: VibeItemId): boolean {
    // Track the public snapshot while retaining constant-time identity lookup.
    void this.state.selectedIds
    return this.selected.has(key(id))
  }

  get selectionEnabled(): boolean { return this.enabled }
  get orderingEnabled(): boolean { return this.canArrange }
  get actions() { return this.selectionOptions.actions ?? [] }
  getItems(): readonly VibeItem[] { return this.options.getItems() }

  private itemIndex(): Map<string, VibeItem> {
    const items = this.options.getItems()
    if (items !== this.cachedItems || items.length !== this.cachedLength) {
      this.cachedItems = items
      this.cachedLength = items.length
      this.cachedIndex = new Map(items.map((item) => [key(item.postId), item]))
    }
    return this.cachedIndex
  }

  private collectionKey(): unknown {
    const configured = this.options.ordering?.collectionKey
    return this.options.getCollectionKey?.() ?? (typeof configured === 'function' ? configured() : configured)
  }

  set(ids: readonly VibeItemId[], notify = true): void {
    if (!this.enabled || this.destroyed) return
    const available = this.itemIndex()
    const next = new Map<string, VibeItemId>()
    for (const id of ids) {
      const item = available.get(key(id))
      next.set(key(id), item?.postId ?? this.selected.get(key(id)) ?? id)
      if (item) this.labels.set(key(id), this.selectionOptions.getLabel?.(item) ?? String(item.postId))
    }
    const previousKeys = [...this.selected.keys()]
    const unchanged = next.size === this.selected.size
      && [...next.keys()].every((id, index) => id === previousKeys[index])
    this.selected = next
    for (const id of this.labels.keys()) if (!next.has(id)) this.labels.delete(id)
    this.state.selectedIds = Object.freeze([...next.values()])
    this.state.count = next.size
    if (notify && !unchanged) this.selectionOptions.onChange?.(this.getSelection())
  }

  toggle(id: VibeItemId): void {
    this.set(this.isSelected(id)
      ? this.state.selectedIds.filter((selected) => key(selected) !== key(id))
      : [...this.state.selectedIds, id])
  }

  clear(): void { this.set([]) }

  getLabel(id: VibeItemId): string {
    const item = this.itemIndex().get(key(id))
    return item ? this.selectionOptions.getLabel?.(item) ?? String(item.postId) : this.labels.get(key(id)) ?? String(id)
  }

  setMode(mode: VibeInteractionMode): void {
    if (this.destroyed) return
    if (mode === 'select' && !this.enabled) return
    if (mode === 'arrange' && !this.canArrange) return
    this.state.mode = mode
  }

  /** Returns null when the selected group belongs to another/unloaded collection. */
  getMoveIds(source: VibeItemId): readonly VibeItemId[] | null {
    const items = this.options.getItems()
    const sourceItem = items.find((item) => key(item.postId) === key(source))
    if (!sourceItem) return null
    if (!this.isSelected(source)) return [sourceItem.postId]
    const members = items.filter((item) => this.isSelected(item.postId)).map((item) => item.postId)
    return members.length === this.selected.size ? members : null
  }

  async reorder(source: VibeItemId, target: VibeItemId, position: VibeReorderPosition): Promise<boolean> {
    if (!this.options.ordering || this.state.busy || this.destroyed) return false
    const moved = this.getMoveIds(source)
    if (!moved) {
      this.state.error = 'Open a collection containing all selected items before moving them.'
      return false
    }
    const movedKeys = new Set(moved.map(key))
    const targetItem = this.options.getItems().find((item) => key(item.postId) === key(target))
    if (!targetItem || movedKeys.has(key(target))) return false
    const collectionKey = this.collectionKey()
    return this.perform(async (signal) => {
      await this.options.ordering!.onReorder({ movedPostIds: Object.freeze([...moved]), targetPostId: targetItem.postId, position, signal })
      if (signal.aborted || collectionKey !== this.collectionKey()) return false
      // Confirm before applying. This leaves failures untouched and retains pages
      // appended while the consumer persists the move, without snapshot rollback.
      const current = this.options.getItems()
      const byId = new Map(current.map((item) => [key(item.postId), item]))
      if (!byId.has(key(target)) || moved.some((id) => !byId.has(key(id)))) return false
      const rest = current.filter((item) => !movedKeys.has(key(item.postId)))
      const at = rest.findIndex((item) => key(item.postId) === key(target))
      rest.splice(at + (position === 'after' ? 1 : 0), 0, ...moved.map((id) => byId.get(key(id))!))
      this.options.setItems(rest)
    }, 'Could not save the new order. Try again.', () => this.reorder(source, target, position))
  }

  async runAction(id: string): Promise<boolean> {
    if (this.state.busy || this.state.count === 0 || this.destroyed) return false
    const action = this.selectionOptions.actions?.find((candidate) => candidate.id === id)
    if (!action) return false
    const ids = this.getSelection().selectedIds
    const execute = () => this.perform((signal) => Promise.resolve(action.run(ids, { signal })),
      'Could not complete the action. Try again.', execute)
    return execute()
  }

  private async perform(
    run: (signal: AbortSignal) => Promise<void | boolean>, error: string, retry: () => Promise<boolean>,
  ): Promise<boolean> {
    const controller = new AbortController()
    this.pending = controller
    this.state.busy = true
    this.state.error = null
    this.retryOperation = null
    try {
      const result = await run(controller.signal)
      return !controller.signal.aborted && result !== false
    } catch {
      if (!controller.signal.aborted) {
        this.state.error = error
        this.retryOperation = retry
      }
      return false
    } finally {
      if (this.pending === controller) {
        this.pending = null
        this.state.busy = false
      }
    }
  }

  async retry(): Promise<boolean> { return this.retryOperation?.() ?? false }

  /** Consumers must honor the signal to stop remote work already in progress. */
  cancel(): void {
    this.pending?.abort()
    this.pending = null
    this.state.busy = false
    this.state.error = null
    this.retryOperation = null
  }

  destroy(): void {
    this.cancel()
    this.destroyed = true
  }
}
