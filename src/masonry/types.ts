export type PageToken = string | number

export type MasonryRestoredPages = PageToken | PageToken[]

export type BackfillStats = {
  enabled: boolean
  // True only while the component is actively doing additional fetches to reach pageSize.
  // This is NOT the same as mode=backfill.
  isBackfillActive: boolean
  isRequestInFlight: boolean
  requestPage: PageToken | null
  progress: {
    collected: number
    target: number
  }
  cooldownMsRemaining: number
  cooldownMsTotal: number
  pageSize: number
  bufferSize: number
  lastBatch: {
    startPage: PageToken | null
    pages: PageToken[]
    usedFromBuffer: number
    fetchedFromNetwork: number
    collectedTotal: number
    emitted: number
    carried: number
  } | null
  totals: {
    pagesFetched: number
    itemsFetchedFromNetwork: number
  }
}

export type MasonryItemBase = {
  id: string
  width: number
  height: number
  originalIndex?: number
  type?: string
  preview?: string
  original?: string
  [key: string]: unknown
}

export type GetContentResult<TItem extends MasonryItemBase> = {
  items: TItem[]
  nextPage: PageToken | null
}

export type GetContentFn<TItem extends MasonryItemBase> = (
  pageToken: PageToken
) => Promise<GetContentResult<TItem>>

export type MasonryMode = 'default' | 'backfill'

export type MasonryProps = {
  getContent: GetContentFn<MasonryItemBase>
  mode?: MasonryMode
  pageSize?: number
  backfillRequestDelayMs?: number
  /**
   * Staggers the enter animation when multiple items start entering together.
   * Set to 0 to disable.
   */
  enterStaggerMs?: number
  items?: MasonryItemBase[]
  page?: PageToken
  restoredPages?: MasonryRestoredPages
  itemWidth?: number
  prefetchThresholdPx?: number
  gapX?: number
  gapY?: number
  headerHeight?: number
  footerHeight?: number
  overscanPx?: number
}

export const masonryDefaults = {
  mode: 'default',
  pageSize: 20,
  backfillRequestDelayMs: 2000,
  enterStaggerMs: 40,
  page: 1,
  itemWidth: 300,
  prefetchThresholdPx: 200,
  gapX: 16,
  gapY: 16,
  headerHeight: 0,
  footerHeight: 0,
  overscanPx: 600,
} as const satisfies Omit<Required<MasonryProps>, 'getContent' | 'items' | 'restoredPages'>
