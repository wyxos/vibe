import type { VibeViewerAsset, VibeViewerItem, VibeViewerType } from '@/components/vibeViewer'

import { fakeMediaFileItems } from '@/demo/fakeMediaFileItems'
import { fakeMediaVisualItems } from '@/demo/fakeMediaVisualItems'

export type FakeMediaType = VibeViewerType
export type FakeMediaAsset = VibeViewerAsset
export type FakeMediaItem = VibeViewerItem

export interface FakeMediaPageRequest {
  page?: number | string | null
  pageSize?: number
}

export interface FakeMediaPageResponse {
  items: FakeMediaItem[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
  nextPage: string | null
  latencyMs: number
}

export interface CreateFakeMediaServerOptions {
  items?: FakeMediaItem[]
  defaultPageSize?: number
  totalPages?: number
  minDelayMs?: number
  maxDelayMs?: number
}

const DEFAULT_PAGE_SIZE = 25
const DEFAULT_TOTAL_PAGES = 100
const DEFAULT_MIN_DELAY_MS = 140
const DEFAULT_MAX_DELAY_MS = 320

function cloneAsset(asset: FakeMediaAsset): FakeMediaAsset {
  return { ...asset }
}

function createLatency(minDelayMs: number, maxDelayMs: number) {
  const safeMin = Math.max(0, Math.floor(minDelayMs))
  const safeMax = Math.max(safeMin, Math.floor(maxDelayMs))
  return Math.floor(Math.random() * (safeMax - safeMin + 1)) + safeMin
}

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })
}

function normalizePage(page: number | string | null | undefined) {
  if (page == null) {
    return 1
  }

  const parsed = typeof page === 'string' ? Number.parseInt(page, 10) : page

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1
  }

  return Math.floor(parsed)
}

function normalizePageSize(pageSize: number | undefined, fallback: number) {
  if (!pageSize || !Number.isFinite(pageSize) || pageSize < 1) {
    return fallback
  }

  return Math.floor(pageSize)
}

function normalizeTotalPages(totalPages: number | undefined, fallback: number) {
  if (!totalPages || !Number.isFinite(totalPages) || totalPages < 1) {
    return fallback
  }

  return Math.floor(totalPages)
}

function slicePage(items: FakeMediaItem[], page: number, pageSize: number) {
  return items.slice((page - 1) * pageSize, page * pageSize)
}

function cloneItem(item: FakeMediaItem, index: number): FakeMediaItem {
  return {
    ...item,
    id: `${item.id}-${String(index + 1).padStart(4, '0')}`,
    preview: item.preview ? cloneAsset(item.preview) : undefined,
  }
}

function buildFakeFeed(seedItems: FakeMediaItem[], totalItems: number) {
  if (!seedItems.length) {
    return []
  }

  return Array.from({ length: totalItems }, (_, index) => {
    const seedIndex = index % seedItems.length
    return cloneItem(seedItems[seedIndex], index)
  })
}

function ensureAudioPreview(item: FakeMediaItem) {
  if (item.type !== 'audio' || item.preview) {
    return item
  }

  return {
    ...item,
    preview: {
      url: item.url,
    },
  }
}

const baseSeedItems = [...fakeMediaVisualItems, ...fakeMediaFileItems].map(ensureAudioPreview)

export const fakeMediaItems = buildFakeFeed(baseSeedItems, DEFAULT_PAGE_SIZE * DEFAULT_TOTAL_PAGES)

export function createFakeMediaServer(options: CreateFakeMediaServerOptions = {}) {
  const defaultPageSize = normalizePageSize(options.defaultPageSize, DEFAULT_PAGE_SIZE)
  const totalPages = normalizeTotalPages(options.totalPages, DEFAULT_TOTAL_PAGES)
  const minDelayMs = options.minDelayMs ?? DEFAULT_MIN_DELAY_MS
  const maxDelayMs = options.maxDelayMs ?? DEFAULT_MAX_DELAY_MS
  const items = [...(options.items ?? buildFakeFeed(baseSeedItems, defaultPageSize * totalPages))]

  return {
    async fetchPage(request: FakeMediaPageRequest = {}): Promise<FakeMediaPageResponse> {
      const page = normalizePage(request.page)
      const pageSize = normalizePageSize(request.pageSize, defaultPageSize)
      const latencyMs = createLatency(minDelayMs, maxDelayMs)

      await delay(latencyMs)

      return {
        items: slicePage(items, page, pageSize),
        page,
        pageSize,
        totalItems: items.length,
        totalPages: Math.max(1, Math.ceil(items.length / pageSize)),
        nextPage: page * pageSize < items.length ? String(page + 1) : null,
        latencyMs,
      }
    },

    list(): FakeMediaItem[] {
      return [...items]
    },

    getById(id: string) {
      return items.find((item) => item.id === id) ?? null
    },
  }
}

export const fakeMediaServer = createFakeMediaServer()

export async function fetchFakeMediaPage(request: FakeMediaPageRequest = {}) {
  return fakeMediaServer.fetchPage(request)
}
