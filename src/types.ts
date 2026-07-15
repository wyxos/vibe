export type VibeCursor = string | number | null
export type VibeItemId = string | number
export type VibeLayout = 'masonry' | 'reel'

export interface VibePreview {
  src: string
  width: number | null
  height: number | null
}

export interface VibeMediaAsset {
  src: string
  preview: VibePreview
  width: number | null
  height: number | null
}

export interface VibeItem extends VibeMediaAsset {
  postId: VibeItemId
  items: VibeMediaAsset[]
}

export interface VibePage {
  items: VibeItem[]
  next: VibeCursor
  total?: number
}

export interface VibePageRequest {
  cursor: VibeCursor
  signal: AbortSignal
}

export type VibePageLoader = (
  request: VibePageRequest,
) => Promise<VibePage>

export type VibeInitialPage = VibePage

export interface CreateVibeOptions {
  target: Element | string
  layout?: VibeLayout
  infiniteScroll?: boolean
  initialPage?: VibeInitialPage
  loadPage?: VibePageLoader
}

export interface VibeState {
  error: unknown | null
  infiniteScroll: boolean
  isLoading: boolean
  isLoadingMore: boolean
  items: readonly VibeItem[]
  layout: VibeLayout
  next: VibeCursor
  nextPageError: unknown | null
  total: number | null
}

export interface VibeInstance {
  destroy: () => void
  getState: () => VibeState
  loadNext: () => Promise<void>
  mount: () => Promise<void>
  reload: () => Promise<void>
  setInfiniteScroll: (enabled: boolean) => void
  setLayout: (layout: VibeLayout) => void
}
