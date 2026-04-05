import type { VibeViewerAsset, VibeViewerItem, VibeViewerType } from '@/components/vibeViewer'

import { fakeMediaFileItems } from '@/demo/fakeMediaFileItems'
import { fakeMediaVisualItems } from '@/demo/fakeMediaVisualItems'

type VisualMediaType = Extract<VibeViewerType, 'image' | 'video'>

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
  minDelayMs?: number
  maxDelayMs?: number
}

const DEFAULT_PAGE_SIZE = 8
const DEFAULT_MIN_DELAY_MS = 140
const DEFAULT_MAX_DELAY_MS = 320

function cloneAsset(asset: FakeMediaAsset): FakeMediaAsset {
  return { ...asset }
}

function isVisualItem(item: FakeMediaItem): item is FakeMediaItem & { type: VisualMediaType } {
  return item.type === 'image' || item.type === 'video'
}

function resolveVisualDimensions(item: FakeMediaItem) {
  if (!isVisualItem(item)) {
    return item
  }

  const source = (item.preview?.width && item.preview.height) ? item.preview : item.original

  if (!source.width || !source.height) {
    throw new Error('Visual media items require preview or original dimensions.')
  }

  return {
    ...item,
    width: source.width,
    height: source.height,
  }
}

function ensurePreviewAsset(item: FakeMediaItem) {
  if (item.type === 'audio') {
    return {
      ...item,
      preview: cloneAsset(item.original),
    }
  }

  if (item.preview) {
    return item
  }

  return {
    ...item,
    preview: cloneAsset(item.original),
  }
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

function slicePage(items: FakeMediaItem[], page: number, pageSize: number) {
  return items.slice((page - 1) * pageSize, page * pageSize)
}

const seedItems = [...fakeMediaVisualItems, ...fakeMediaFileItems]
  .map(resolveVisualDimensions)
  .map(ensurePreviewAsset)
  .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))

export const fakeMediaItems = [...seedItems]

export function createFakeMediaServer(options: CreateFakeMediaServerOptions = {}) {
  const items = [...(options.items ?? fakeMediaItems)]
  const defaultPageSize = normalizePageSize(options.defaultPageSize, DEFAULT_PAGE_SIZE)
  const minDelayMs = options.minDelayMs ?? DEFAULT_MIN_DELAY_MS
  const maxDelayMs = options.maxDelayMs ?? DEFAULT_MAX_DELAY_MS

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
