import type { VibeItem, VibeItemId } from './types'

export type VibeInteractionMode = 'browse' | 'select' | 'arrange'
export type VibeReorderPosition = 'before' | 'after'

export interface VibeSelectionSnapshot {
  selectedIds: readonly VibeItemId[]
  count: number
}

export interface VibeSelectionActionContext {
  signal: AbortSignal
}

export interface VibeSelectionAction {
  id: string
  label: string
  /** Receives the entire selection, including IDs outside the loaded page. */
  run: (selectedIds: readonly VibeItemId[], context: VibeSelectionActionContext) => Promise<void> | void
}

export interface VibeSelectionOptions {
  initialIds?: readonly VibeItemId[]
  onChange?: (selection: VibeSelectionSnapshot) => void
  actions?: readonly VibeSelectionAction[]
  /** Used for review rows. Unknown items receive an ID-only fallback. */
  getLabel?: (item: VibeItem) => string
}

export interface VibeReorderRequest {
  movedPostIds: readonly VibeItemId[]
  targetPostId: VibeItemId
  position: VibeReorderPosition
  signal: AbortSignal
}

export interface VibeOrderingOptions {
  /** Save the requested order; reject on failure. Local order changes only after confirmation. */
  onReorder: (request: VibeReorderRequest) => Promise<void> | void
  /** Distinguish ordered collections; change this key when replacing a feed. */
  collectionKey?: string | number | (() => string | number)
}

export interface VibeSelectionState extends VibeSelectionSnapshot {
  mode: VibeInteractionMode
  busy: boolean
  error: string | null
}

export interface VibeSelectionApi {
  getSelection: () => VibeSelectionSnapshot
  setSelection: (ids: readonly VibeItemId[]) => void
  toggleSelection: (id: VibeItemId) => void
  clearSelection: () => void
  setSelectionMode: (mode: VibeInteractionMode) => void
  reorderItems: (source: VibeItemId, target: VibeItemId, position: VibeReorderPosition) => Promise<boolean>
  runSelectionAction: (id: string) => Promise<boolean>
  retrySelectionOperation: () => Promise<boolean>
  cancelSelectionOperation: () => void
}
