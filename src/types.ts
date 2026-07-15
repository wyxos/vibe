import type { Component } from 'vue'
import type { RouteLocationRaw, Router } from 'vue-router'

export type VibeCursor = string | number | null
export type VibeItemId = string | number
export type VibeLayout = 'masonry' | 'reel'
export type VibeLayoutMode = VibeLayout | 'responsive'
export type VibeMediaSource = 'preview' | 'original'

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

export interface VibeCardRegion {
  component: Component
  height: number
}

export interface VibeCardRegionProps {
  index: number
  item: VibeItem
  layout: VibeLayout
  loadedCount: number
  mediaSource: VibeMediaSource
  total: number | null
}

export interface VibeReelRouteContext {
  index: number
  item: VibeItem
  loadedCount: number
  origin: 'masonry' | 'reel'
  total: number | null
}

export interface VibeRoutingOptions {
  feed: RouteLocationRaw | (() => RouteLocationRaw)
  reel: (context: VibeReelRouteContext) => RouteLocationRaw | null
  router: Router
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
  cardFooter?: VibeCardRegion
  cardHeader?: VibeCardRegion
  target: Element | string
  layout?: VibeLayoutMode
  infiniteScroll?: boolean
  initialPage?: VibeInitialPage
  loadPage?: VibePageLoader
  routing?: VibeRoutingOptions
}

export interface VibeState {
  activeReelPostId: VibeItemId | null
  error: unknown | null
  infiniteScroll: boolean
  isLoading: boolean
  isLoadingMore: boolean
  items: readonly VibeItem[]
  layout: VibeLayout
  next: VibeCursor
  nextPageError: unknown | null
  reelOrigin: 'masonry' | null
  total: number | null
}

export interface VibeInstance {
  destroy: () => void
  getState: () => VibeState
  loadNext: () => Promise<void>
  mount: () => Promise<void>
  reload: () => Promise<void>
  setInfiniteScroll: (enabled: boolean) => void
  setLayout: (layout: VibeLayoutMode) => void
}
