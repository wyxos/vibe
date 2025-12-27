export type MasonryItem = {
  id: string
  width: number
  height: number
  page: number
  index: number
  src: string
  // allow extra fields
  [key: string]: any
}

export type ProcessedMasonryItem = MasonryItem & {
  columnWidth: number
  imageHeight: number
  columnHeight: number
  left: number
  top: number
}

export type LayoutOptions = {
  gutterX?: number
  gutterY?: number
  header?: number
  footer?: number
  paddingLeft?: number
  paddingRight?: number
  sizes?: {
    base: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
    '2xl'?: number
  }
  placement?: 'masonry' | 'sequential-balanced'
}

export type GetPageResult = { items: MasonryItem[]; nextPage: number | null }

/**
 * Type for the Masonry component instance (what's exposed via defineExpose)
 * Use this type when accessing the component via template refs
 */
export interface MasonryInstance {
  // Cancels any ongoing load operations (page loads, backfills, etc.)
  cancelLoad: () => void
  // Opaque caller context passed through to getPage(page, context)
  context: any
  // Container height (wrapper element) in pixels
  containerHeight: number
  // Container width (wrapper element) in pixels
  containerWidth: number
  // Current Tailwind breakpoint name (base, sm, md, lg, xl, 2xl) based on containerWidth
  currentBreakpoint: string
  // Current page number or cursor being displayed
  currentPage: number | string | null
  // Completely destroys the component, clearing all state and resetting to initial state
  destroy: () => void
  // Boolean indicating if the end of the list has been reached (no more pages to load)
  hasReachedEnd: boolean
  // Initializes the component with items, page, and next page cursor. Use this for manual init mode.
  initialize: (items: MasonryItem[], page: number | string, next: number | string | null) => void
  // Boolean indicating if the component has been initialized (first content has loaded)
  isInitialized: boolean
  // Boolean indicating if a page load or backfill operation is currently in progress
  isLoading: boolean
  // Error object if the last load operation failed, null otherwise
  loadError: Error | null
  // Loads the next page of items asynchronously
  loadNext: () => Promise<void>
  // Loads a specific page number or cursor asynchronously
  loadPage: (page: number | string) => Promise<void>
  // Array tracking pagination history (pages/cursors that have been loaded)
  paginationHistory: Array<number | string | null>
  // Refreshes the current page by clearing items and reloading from the current page
  refreshCurrentPage: () => Promise<void>
  // Recalculates the layout positions for all items. Call this after manually modifying items.
  refreshLayout: (items: MasonryItem[]) => void
  // Removes a single item from the masonry
  remove: (item: MasonryItem) => void
  // Removes all items from the masonry
  removeAll: () => void
  // Removes multiple items from the masonry in a single operation
  removeMany: (items: MasonryItem[]) => Promise<void> | void
  // Resets the component to initial state (clears items, resets pagination, scrolls to top)
  reset: () => void
  // Restores a single item at its original index (useful for undo operations)
  restore: (item: MasonryItem, index: number) => Promise<void> | void
  // Restores multiple items at their original indices (useful for undo operations)
  restoreMany: (items: MasonryItem[], indices: number[]) => Promise<void> | void
  // Scrolls the container to a specific position
  scrollTo: (position: number) => void
  // Scrolls the container to the top
  scrollToTop: () => void
  // Sets the opaque caller context (alternative to v-model:context)
  setContext: (val: any) => void
  // Sets fixed dimensions for the container, overriding ResizeObserver. Pass null to restore automatic sizing.
  setFixedDimensions: (dimensions: { width: number; height: number } | null) => void
  // Computed property returning the total number of items currently in the masonry
  totalItems: number
}