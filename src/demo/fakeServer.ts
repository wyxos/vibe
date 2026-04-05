import type { VibeViewerAsset, VibeViewerItem, VibeViewerType } from '@/components/vibeViewer'

type VisualMediaType = Extract<VibeViewerType, 'image' | 'video'>
type NonVisualMediaType = Exclude<VibeViewerType, VisualMediaType>

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

interface FakeVisualSeed extends Omit<FakeMediaItem, 'width' | 'height'> {
  type: VisualMediaType
}

const DEFAULT_PAGE_SIZE = 8
const DEFAULT_MIN_DELAY_MS = 140
const DEFAULT_MAX_DELAY_MS = 320

function getVisualDimensions(preview: FakeMediaAsset | undefined, original: FakeMediaAsset) {
  if (preview?.width && preview.height) {
    return {
      width: preview.width,
      height: preview.height,
    }
  }

  if (original.width && original.height) {
    return {
      width: original.width,
      height: original.height,
    }
  }

  throw new Error('Visual media items require preview or original dimensions.')
}

function createVisualItem(seed: FakeVisualSeed): FakeMediaItem {
  return {
    ...seed,
    ...getVisualDimensions(seed.preview, seed.original),
  }
}

function createNonVisualItem(seed: FakeMediaItem & { type: NonVisualMediaType }): FakeMediaItem {
  return seed
}

function cloneAsset(asset: FakeMediaAsset): FakeMediaAsset {
  return {
    ...asset,
  }
}

function ensurePreviewAsset(item: FakeMediaItem): FakeMediaItem {
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
  const start = (page - 1) * pageSize
  const end = start + pageSize

  return items.slice(start, end)
}

const seedItems: FakeMediaItem[] = [
  createVisualItem({
    id: 'img-aurora-board',
    type: 'image',
    title: 'Aurora moodboard',
    extension: 'jpg',
    mimeType: 'image/jpeg',
    sizeBytes: 2_941_120,
    createdAt: '2026-04-04T08:42:00.000Z',
    preview: {
      url: 'https://picsum.photos/id/1015/720/480',
      mimeType: 'image/jpeg',
      sizeBytes: 182_000,
      width: 720,
      height: 480,
    },
    original: {
      url: 'https://picsum.photos/id/1015/2400/1600',
      mimeType: 'image/jpeg',
      sizeBytes: 2_941_120,
      width: 2400,
      height: 1600,
    },
  }),
  createVisualItem({
    id: 'vid-launch-loop',
    type: 'video',
    title: 'Launch loop teaser',
    extension: 'mp4',
    mimeType: 'video/mp4',
    sizeBytes: 14_882_214,
    createdAt: '2026-04-04T08:10:00.000Z',
    durationMs: 22_000,
    preview: {
      url: 'https://samplelib.com/lib/preview/mp4/sample-5s.mp4',
      mimeType: 'video/mp4',
      sizeBytes: 3_742_000,
      width: 640,
      height: 360,
    },
    original: {
      url: 'https://samplelib.com/lib/preview/mp4/sample-20s.mp4',
      mimeType: 'video/mp4',
      sizeBytes: 14_882_214,
      width: 1920,
      height: 1080,
    },
  }),
  createNonVisualItem({
    id: 'audio-voiceover-cut',
    type: 'audio',
    title: 'Voiceover rough cut',
    extension: 'mp3',
    mimeType: 'audio/mpeg',
    sizeBytes: 3_884_214,
    createdAt: '2026-04-04T07:54:00.000Z',
    durationMs: 186_000,
    original: {
      url: 'https://samplelib.com/lib/preview/mp3/sample-3s.mp3',
      mimeType: 'audio/mpeg',
      sizeBytes: 3_884_214,
    },
  }),
  createNonVisualItem({
    id: 'doc-brand-guidelines',
    type: 'document',
    title: 'Brand guidelines',
    extension: 'pdf',
    mimeType: 'application/pdf',
    sizeBytes: 8_122_019,
    createdAt: '2026-04-04T07:31:00.000Z',
    preview: {
      url: 'https://picsum.photos/id/1033/600/800',
      mimeType: 'image/jpeg',
      sizeBytes: 144_000,
      width: 600,
      height: 800,
    },
    original: {
      url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 8_122_019,
    },
  }),
  createVisualItem({
    id: 'img-studio-portrait',
    type: 'image',
    title: 'Studio portrait set',
    extension: 'webp',
    mimeType: 'image/webp',
    sizeBytes: 1_208_112,
    createdAt: '2026-04-04T07:04:00.000Z',
    preview: {
      url: 'https://picsum.photos/id/1027/540/720',
      mimeType: 'image/webp',
      sizeBytes: 122_000,
      width: 540,
      height: 720,
    },
    original: {
      url: 'https://picsum.photos/id/1027/1620/2160',
      mimeType: 'image/webp',
      sizeBytes: 1_208_112,
      width: 1620,
      height: 2160,
    },
  }),
  createVisualItem({
    id: 'vid-dashboard-walkthrough',
    type: 'video',
    title: 'Dashboard walkthrough',
    extension: 'mp4',
    mimeType: 'video/mp4',
    sizeBytes: 48_120_004,
    createdAt: '2026-04-04T06:58:00.000Z',
    durationMs: 93_000,
    preview: {
      url: 'https://samplelib.com/lib/preview/mp4/sample-10s.mp4',
      mimeType: 'video/mp4',
      sizeBytes: 11_900_000,
      width: 1280,
      height: 720,
    },
    original: {
      url: 'https://samplelib.com/lib/preview/mp4/sample-30s.mp4',
      mimeType: 'video/mp4',
      sizeBytes: 48_120_004,
      width: 2560,
      height: 1440,
    },
  }),
  createNonVisualItem({
    id: 'archive-release-assets',
    type: 'archive',
    title: 'Release assets bundle',
    extension: 'zip',
    mimeType: 'application/zip',
    sizeBytes: 128_000_552,
    createdAt: '2026-04-04T06:30:00.000Z',
    original: {
      url: 'https://example.com/files/release-assets-v03.zip',
      mimeType: 'application/zip',
      sizeBytes: 128_000_552,
    },
  }),
  createVisualItem({
    id: 'img-product-flatlay',
    type: 'image',
    title: 'Product flatlay',
    extension: 'jpg',
    mimeType: 'image/jpeg',
    sizeBytes: 3_612_900,
    createdAt: '2026-04-04T06:14:00.000Z',
    preview: {
      url: 'https://picsum.photos/id/1060/760/506',
      mimeType: 'image/jpeg',
      sizeBytes: 176_000,
      width: 760,
      height: 506,
    },
    original: {
      url: 'https://picsum.photos/id/1060/3040/2026',
      mimeType: 'image/jpeg',
      sizeBytes: 3_612_900,
      width: 3040,
      height: 2026,
    },
  }),
  createNonVisualItem({
    id: 'other-scene-model',
    type: 'other',
    title: 'Trade-show booth model',
    extension: 'glb',
    mimeType: 'model/gltf-binary',
    sizeBytes: 24_805_300,
    createdAt: '2026-04-04T05:46:00.000Z',
    original: {
      url: 'https://example.com/files/trade-show-booth.glb',
      mimeType: 'model/gltf-binary',
      sizeBytes: 24_805_300,
    },
  }),
  createNonVisualItem({
    id: 'audio-field-recording',
    type: 'audio',
    title: 'Field recording ambience',
    extension: 'wav',
    mimeType: 'audio/wav',
    sizeBytes: 34_052_110,
    createdAt: '2026-04-04T05:21:00.000Z',
    durationMs: 441_000,
    original: {
      url: 'https://samplelib.com/lib/preview/wav/sample-6s.wav',
      mimeType: 'audio/wav',
      sizeBytes: 34_052_110,
    },
  }),
  createVisualItem({
    id: 'img-event-wide',
    type: 'image',
    title: 'Event floor panorama',
    extension: 'jpg',
    mimeType: 'image/jpeg',
    sizeBytes: 4_822_670,
    createdAt: '2026-04-04T04:58:00.000Z',
    original: {
      url: 'https://picsum.photos/id/1040/2800/1575',
      mimeType: 'image/jpeg',
      sizeBytes: 4_822_670,
      width: 2800,
      height: 1575,
    },
  }),
  createNonVisualItem({
    id: 'doc-q2-roadmap',
    type: 'document',
    title: 'Q2 roadmap draft',
    extension: 'pptx',
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    sizeBytes: 5_240_131,
    createdAt: '2026-04-04T04:36:00.000Z',
    preview: {
      url: 'https://picsum.photos/id/1050/640/360',
      mimeType: 'image/jpeg',
      sizeBytes: 98_000,
      width: 640,
      height: 360,
    },
    original: {
      url: 'https://example.com/files/q2-roadmap-draft.pptx',
      mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      sizeBytes: 5_240_131,
    },
  }),
  createVisualItem({
    id: 'vid-bts-timelapse',
    type: 'video',
    title: 'Behind-the-scenes timelapse',
    extension: 'mp4',
    mimeType: 'video/mp4',
    sizeBytes: 12_621_443,
    createdAt: '2026-04-04T04:05:00.000Z',
    durationMs: 16_000,
    preview: {
      url: 'https://samplelib.com/lib/preview/mp4/sample-5s.mp4',
      mimeType: 'video/mp4',
      sizeBytes: 3_742_000,
      width: 540,
      height: 960,
    },
    original: {
      url: 'https://samplelib.com/lib/preview/mp4/sample-15s.mp4',
      mimeType: 'video/mp4',
      sizeBytes: 12_621_443,
      width: 1080,
      height: 1920,
    },
  }),
  createNonVisualItem({
    id: 'other-dataset-export',
    type: 'other',
    title: 'Analytics export',
    extension: 'json',
    mimeType: 'application/json',
    sizeBytes: 1_042_228,
    createdAt: '2026-04-04T03:58:00.000Z',
    original: {
      url: 'https://example.com/files/analytics-export.json',
      mimeType: 'application/json',
      sizeBytes: 1_042_228,
    },
  }),
  createVisualItem({
    id: 'img-atlas-cover',
    type: 'image',
    title: 'Atlas cover artwork',
    extension: 'png',
    mimeType: 'image/png',
    sizeBytes: 5_121_882,
    createdAt: '2026-04-04T03:25:00.000Z',
    preview: {
      url: 'https://picsum.photos/id/1003/600/900',
      mimeType: 'image/png',
      sizeBytes: 210_000,
      width: 600,
      height: 900,
    },
    original: {
      url: 'https://picsum.photos/id/1003/1800/2700',
      mimeType: 'image/png',
      sizeBytes: 5_121_882,
      width: 1800,
      height: 2700,
    },
  }),
  createNonVisualItem({
    id: 'audio-notification-pack',
    type: 'audio',
    title: 'Notification pack',
    extension: 'mp3',
    mimeType: 'audio/mpeg',
    sizeBytes: 902_118,
    createdAt: '2026-04-04T03:02:00.000Z',
    durationMs: 49_000,
    original: {
      url: 'https://samplelib.com/lib/preview/mp3/sample-12s.mp3',
      mimeType: 'audio/mpeg',
      sizeBytes: 902_118,
    },
  }),
  createNonVisualItem({
    id: 'doc-legal-brief',
    type: 'document',
    title: 'Vendor legal brief',
    extension: 'docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    sizeBytes: 742_904,
    createdAt: '2026-04-04T02:48:00.000Z',
    original: {
      url: 'https://example.com/files/vendor-legal-brief.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      sizeBytes: 742_904,
    },
  }),
  createVisualItem({
    id: 'vid-street-loop',
    type: 'video',
    title: 'Street texture loop',
    extension: 'mp4',
    mimeType: 'video/mp4',
    sizeBytes: 9_220_604,
    createdAt: '2026-04-04T02:23:00.000Z',
    durationMs: 12_000,
    preview: {
      url: 'https://samplelib.com/lib/preview/mp4/sample-10s.mp4',
      mimeType: 'video/mp4',
      sizeBytes: 7_640_000,
      width: 640,
      height: 360,
    },
    original: {
      url: 'https://samplelib.com/lib/preview/mp4/sample-20s.mp4',
      mimeType: 'video/mp4',
      sizeBytes: 9_220_604,
      width: 1280,
      height: 720,
    },
  }),
  createVisualItem({
    id: 'img-typography-specimen',
    type: 'image',
    title: 'Typography specimen board',
    extension: 'jpg',
    mimeType: 'image/jpeg',
    sizeBytes: 2_118_201,
    createdAt: '2026-04-04T01:52:00.000Z',
    preview: {
      url: 'https://picsum.photos/id/1039/680/510',
      mimeType: 'image/jpeg',
      sizeBytes: 161_000,
      width: 680,
      height: 510,
    },
    original: {
      url: 'https://picsum.photos/id/1039/2040/1530',
      mimeType: 'image/jpeg',
      sizeBytes: 2_118_201,
      width: 2040,
      height: 1530,
    },
  }),
  createNonVisualItem({
    id: 'archive-caption-bundle',
    type: 'archive',
    title: 'Caption exports',
    extension: 'tar',
    mimeType: 'application/x-tar',
    sizeBytes: 18_120_005,
    createdAt: '2026-04-04T01:35:00.000Z',
    original: {
      url: 'https://example.com/files/caption-exports.tar',
      mimeType: 'application/x-tar',
      sizeBytes: 18_120_005,
    },
  }),
  createVisualItem({
    id: 'vid-ui-capture',
    type: 'video',
    title: 'UI interaction capture',
    extension: 'mp4',
    mimeType: 'video/mp4',
    sizeBytes: 21_444_219,
    createdAt: '2026-04-04T01:08:00.000Z',
    durationMs: 38_000,
    preview: {
      url: 'https://samplelib.com/lib/preview/mp4/sample-5s.mp4',
      mimeType: 'video/mp4',
      sizeBytes: 3_742_000,
      width: 720,
      height: 450,
    },
    original: {
      url: 'https://samplelib.com/lib/preview/mp4/sample-10s.mp4',
      mimeType: 'video/mp4',
      sizeBytes: 21_444_219,
      width: 1440,
      height: 900,
    },
  }),
  createNonVisualItem({
    id: 'other-copy-deck',
    type: 'other',
    title: 'Campaign copy deck',
    extension: 'md',
    mimeType: 'text/markdown',
    sizeBytes: 42_881,
    createdAt: '2026-04-04T00:49:00.000Z',
    original: {
      url: 'https://example.com/files/campaign-copy-deck.md',
      mimeType: 'text/markdown',
      sizeBytes: 42_881,
    },
  }),
  createNonVisualItem({
    id: 'audio-podcast-note',
    type: 'audio',
    title: 'Podcast chapter note',
    extension: 'mp3',
    mimeType: 'audio/mpeg',
    sizeBytes: 6_204_901,
    createdAt: '2026-04-04T00:14:00.000Z',
    durationMs: 302_000,
    original: {
      url: 'https://samplelib.com/lib/preview/mp3/sample-12s.mp3',
      mimeType: 'audio/mpeg',
      sizeBytes: 6_204_901,
    },
  }),
].map(ensurePreviewAsset).sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))

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
      const pageItems = slicePage(items, page, pageSize)
      const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
      const nextPage = page * pageSize < items.length ? String(page + 1) : null
      const latencyMs = createLatency(minDelayMs, maxDelayMs)

      await delay(latencyMs)

      return {
        items: pageItems,
        page,
        pageSize,
        totalItems: items.length,
        totalPages,
        nextPage,
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
