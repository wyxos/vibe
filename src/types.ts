import type { Component } from 'vue'
import type { RouteLocationRaw, Router } from 'vue-router'

export type VibeCursor = string | number | null
export type VibeItemId = string | number
export type VibeLayout = 'masonry' | 'reel'
export type VibeLayoutMode = VibeLayout | 'responsive'
export type VibeLifecycle = 'error' | 'loaded' | 'loading'
export type VibeMediaSource = 'preview' | 'original'
export type VibeAutofillStrategy = 'backend' | 'frontend'
export type VibeAutofillPageLimit = number | 'unlimited'
export type VibeFillStrategy = 'backend' | 'frontend'
export type VibeAutofillStatus =
  | 'cancelled'
  | 'cancelling'
  | 'complete'
  | 'error'
  | 'exhausted'
  | 'filling'
  | 'idle'
  | 'restoring'
  | 'waiting'
export type VibeFillStatus =
  | 'cancelled'
  | 'cancelling'
  | 'complete'
  | 'error'
  | 'exhausted'
  | 'filling'
  | 'idle'
  | 'restoring'
  | 'waiting'

export type VibeFillTarget =
  | { pages: number }
  | { until: 'end' }

export interface VibeAutoScrollOptions {
  enabled?: boolean
  maxSpeedPxPerSecond?: number
  minSpeedPxPerSecond?: number
  speedPxPerSecond?: number
}

export interface VibeAutoScrollState {
  enabled: boolean
  maxSpeedPxPerSecond: number
  minSpeedPxPerSecond: number
  paused: boolean
  speedPxPerSecond: number
}

export interface VibeReelAutoAdvanceOptions {
  enabled?: boolean
  includePostItems?: boolean
  intervalMs?: number
}

export interface VibeReelAutoAdvanceState {
  enabled: boolean
  includePostItems: boolean
  intervalMs: number
}

export type VibeReelOrigin = 'masonry' | 'reel'

export interface VibeReelInfoSheetOptions {
  component: Component
  enabled?: boolean
}

export interface VibeReelInfoSheetState {
  enabled: boolean
}

export type VibeReelForwardStatus = 'end' | 'error' | 'idle' | 'loading'

export interface VibeReelForwardState {
  error: unknown | null
  status: VibeReelForwardStatus
}

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

export interface VibeItemPlacement {
  index: number
  item: VibeItem
}

export interface VibeMediaTarget {
  mediaIndex: number
  postId: VibeItemId
}

export interface VibeMediaPlacement extends VibeMediaTarget {
  media: VibeMediaAsset
  postIndex: number
}

declare const vibeRemovalBrand: unique symbol
declare const vibeMediaRemovalBrand: unique symbol

export type VibeRemoval = readonly VibeItemPlacement[] & {
  readonly [vibeRemovalBrand]: true
}

export type VibeMediaRemoval = Readonly<VibeMediaPlacement> & {
  readonly [vibeMediaRemovalBrand]: true
}

export interface VibeCardRegion {
  background?: 'default' | 'transparent'
  component: Component
  height: number
}

export interface VibeCardChromeStyle {
  background?: 'default' | 'transparent'
  paddingX?: number
  paddingY?: number
}

export interface VibeMediaCardOptions {
  footer?: VibeCardChromeStyle
  header?: VibeCardChromeStyle
  videoMuted?: boolean
}

export interface VibeCardRegionProps {
  index: number
  item: VibeItem
  layout: VibeLayout
  loadedCount: number
  mediaCount: number
  mediaIndex: number
  mediaItem: VibeMediaAsset
  mediaSource: VibeMediaSource
  total: number | null
}

export interface VibeFeedFooter {
  component: Component
}

export interface VibeFeedFooterActions {
  cancelAutofill: () => Promise<void>
  loadMore: () => Promise<void>
  retry: () => Promise<void>
  retryEnd: () => Promise<void>
}

export interface VibeFeedFooterProps {
  actions: VibeFeedFooterActions
  canRetryEnd: boolean
  showLoadMore?: boolean
  state: VibeState
}

export interface VibeReelInfoSheetProps extends VibeCardRegionProps {
  close: () => void
  layout: 'reel'
  origin: VibeReelOrigin
}

export interface VibeReelRouteContext {
  index: number
  item: VibeItem
  loadedCount: number
  origin: VibeReelOrigin
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

export interface VibeAutofillState {
  cycleId: string | null
  delayRemainingMs: number | null
  enabled: boolean
  error: unknown | null
  feedKey: string | null
  missing: number
  nextRequestAt: number | null
  pageSize: number | null
  received: number
  requests: number
  sequence: number
  sessionId: string | null
  status: VibeAutofillStatus
  strategy: VibeAutofillStrategy | null
}

export interface VibeRequestDelayOptions {
  delayMaxMs?: number
  delayStepMs?: number
}

export interface VibeFrontendAutofillOptions extends VibeRequestDelayOptions {
  maxAdditionalPages?: VibeAutofillPageLimit
  pageSize: number
  strategy: 'frontend'
}

export interface VibeBackendAutofillStartContext {
  cycleId: string
  feedKey: string
  items: readonly VibeItem[]
  missing: number
  next: VibeCursor
  pageSize: number
  received: number
  signal: AbortSignal
  total: number | null
}

export interface VibeBackendAutofillSession {
  nextRequestAt?: number | null
  received?: number
  sequence?: number
  sessionId: string
}

export interface VibeBackendAutofillCancelContext {
  cycleId: string
  feedKey: string
  sessionId: string | null
}

type VibeBackendAutofillUpdateStatus = Extract<
  VibeAutofillStatus,
  'cancelled' | 'complete' | 'error' | 'exhausted' | 'waiting'
>

interface VibeBackendAutofillUpdateBase {
  error?: unknown
  feedKey: string
  items?: VibeItem[]
  nextRequestAt?: number | null
  received: number
  requests?: number
  sequence: number
  sessionId: string
  total?: number
}

export type VibeBackendAutofillUpdate = VibeBackendAutofillUpdateBase & (
  | {
    next: VibeCursor
    status: Extract<VibeBackendAutofillUpdateStatus, 'complete' | 'exhausted'>
  }
  | {
    next?: VibeCursor
    status: Exclude<VibeBackendAutofillUpdateStatus, 'complete' | 'exhausted'>
  }
)

export type VibeAutofillSessionSnapshot = VibeBackendAutofillUpdate & {
  cycleId: string
  pageSize: number
  requests?: number
}

export interface VibeBackendAutofillOptions {
  feedKey: string
  initialSession?: VibeAutofillSessionSnapshot
  onCancel: (
    context: VibeBackendAutofillCancelContext,
  ) => Promise<void> | void
  onUnderfilled: (
    context: VibeBackendAutofillStartContext,
  ) => Promise<VibeBackendAutofillSession> | VibeBackendAutofillSession
  pageSize: number
  strategy: 'backend'
}

export type VibeAutofillOptions =
  | VibeBackendAutofillOptions
  | VibeFrontendAutofillOptions

export interface VibeFillState {
  completedPages: number
  cycleId: string | null
  delayRemainingMs: number | null
  enabled: boolean
  error: unknown | null
  feedKey: string | null
  nextRequestAt: number | null
  received: number
  sequence: number
  sessionId: string | null
  status: VibeFillStatus
  strategy: VibeFillStrategy | null
  target: VibeFillTarget | null
}

export interface VibeFrontendFillOptions extends VibeRequestDelayOptions {
  strategy: 'frontend'
}

export interface VibeBackendFillStartContext {
  cycleId: string
  feedKey: string
  items: readonly VibeItem[]
  next: VibeCursor
  signal: AbortSignal
  target: VibeFillTarget
  total: number | null
}

export interface VibeBackendFillSession {
  completedPages?: number
  nextRequestAt?: number | null
  received?: number
  sequence?: number
  sessionId: string
}

export interface VibeBackendFillCancelContext {
  cycleId: string
  feedKey: string
  sessionId: string | null
}

type VibeBackendFillUpdateStatus = Extract<
  VibeFillStatus,
  'cancelled' | 'complete' | 'error' | 'exhausted' | 'waiting'
>

interface VibeBackendFillUpdateBase {
  completedPages: number
  error?: unknown
  feedKey: string
  nextRequestAt?: number | null
  received: number
  sequence: number
  sessionId: string
  total?: number
}

export type VibeBackendFillUpdate = VibeBackendFillUpdateBase & (
  | {
    items: VibeItem[]
    lastCursor: VibeCursor
    next: VibeCursor
    status: Extract<VibeBackendFillUpdateStatus, 'complete' | 'exhausted'>
  }
  | {
    items?: never
    lastCursor?: never
    next?: never
    status: Exclude<VibeBackendFillUpdateStatus, 'complete' | 'exhausted'>
  }
)

export type VibeFillSessionSnapshot = VibeBackendFillUpdate & {
  cycleId: string
  target: VibeFillTarget
}

export interface VibeBackendFillOptions {
  feedKey: string
  initialSession?: VibeFillSessionSnapshot
  onCancel: (
    context: VibeBackendFillCancelContext,
  ) => Promise<void> | void
  onStart: (
    context: VibeBackendFillStartContext,
  ) => Promise<VibeBackendFillSession> | VibeBackendFillSession
  strategy: 'backend'
}

export type VibeFillOptions = VibeBackendFillOptions | VibeFrontendFillOptions

export interface CreateVibeOptions {
  autoScroll?: VibeAutoScrollOptions
  autofill?: VibeAutofillOptions
  cardFooter?: VibeCardRegion
  cardHeader?: VibeCardRegion
  feedFooter?: VibeFeedFooter
  fill?: VibeFillOptions
  target: Element | string
  layout?: VibeLayoutMode
  infiniteScroll?: boolean
  initialPage?: VibeInitialPage
  loadPage?: VibePageLoader
  mediaCard?: VibeMediaCardOptions
  onStateChange?: (state: VibeState) => void
  removalHistoryLimit?: number
  reelAutoAdvance?: VibeReelAutoAdvanceOptions
  reelInfoSheet?: VibeReelInfoSheetOptions
  routing?: VibeRoutingOptions
}

export interface VibeState {
  activeReelPostId: VibeItemId | null
  autoScroll: VibeAutoScrollState
  autofill: VibeAutofillState
  error: unknown | null
  fill: VibeFillState
  infiniteScroll: boolean
  isLoading: boolean
  isLoadingMore: boolean
  items: readonly VibeItem[]
  layout: VibeLayout
  lifecycle: VibeLifecycle
  loadMoreLocked: boolean
  next: VibeCursor
  nextPageError: unknown | null
  reelAutoAdvance: VibeReelAutoAdvanceState
  reelForward: VibeReelForwardState
  reelInfoSheet: VibeReelInfoSheetState
  reelOrigin: 'masonry' | null
  total: number | null
}

export interface VibeInstance {
  applyAutofillUpdate: (update: VibeBackendAutofillUpdate) => boolean
  applyFillUpdate: (update: VibeBackendFillUpdate) => boolean
  cancelAutofill: () => Promise<void>
  cancelFill: () => Promise<void>
  destroy: () => void
  fill: (target: VibeFillTarget) => Promise<void>
  getState: () => VibeState
  loadNext: () => Promise<void>
  mount: () => Promise<void>
  nextReelMediaItem: () => boolean
  nextReelPost: () => boolean
  pauseAutoScroll: () => void
  previousReelMediaItem: () => boolean
  previousReelPost: () => boolean
  refresh: () => Promise<void>
  reload: () => Promise<void>
  removeMedia: (target: VibeMediaTarget) => VibeMediaRemoval | null
  removeMediaAnimated?: (target: VibeMediaTarget) => Promise<VibeMediaRemoval | null>
  removeItems: (postIds: readonly VibeItemId[]) => Promise<VibeRemoval>
  resumeAutoScroll: () => void
  restoreAutofillSession: (snapshot: VibeAutofillSessionSnapshot) => boolean
  restoreFillSession: (snapshot: VibeFillSessionSnapshot) => boolean
  restoreItems: (placements: readonly VibeItemPlacement[]) => void
  restoreMediaRemoval: (removal: VibeMediaRemoval) => boolean
  restoreRemoval: (removal: VibeRemoval) => boolean
  retryReelForward: () => Promise<void>
  setAutoScroll: (enabled: boolean, speedPxPerSecond?: number) => void
  setAutoScrollSpeed: (speedPxPerSecond: number) => void
  setInfiniteScroll: (enabled: boolean) => void
  setLayout: (layout: VibeLayoutMode) => void
  setLoadMoreLocked: (locked: boolean) => void
  setReelAutoAdvance: (
    update: boolean | VibeReelAutoAdvanceOptions,
  ) => void
  setReelInfoSheet: (enabled: boolean) => void
  undoLastRemoval: () => VibeRemoval | null
}
