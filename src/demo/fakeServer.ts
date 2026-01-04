const TOTAL_PAGES = 100
const ITEMS_PER_PAGE = 20

const VIDEO_SOURCES = [
  // Prefer stable, long-lived sample endpoints; external CDNs can be flaky.
  'https://media.w3.org/2010/05/sintel/trailer.mp4',
  'https://media.w3.org/2010/05/bunny/trailer.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
]

export type PageToken = string | number

export type FeedItemType = 'image' | 'video'

export interface FeedItem {
  id: string
  type: FeedItemType
  reaction: string | null
  width: number
  height: number
  original: string
  preview: string
  [key: string]: unknown
}

export interface FetchPageResult {
  items: FeedItem[]
  nextPage: PageToken | null
}

export type SearchPageToken = string

export function makeSearchPageToken({ page, query }: { page: number; query: string }): SearchPageToken {
  const p = Math.max(1, Math.trunc(page))
  const q = query?.trim() ?? ''
  const params = new URLSearchParams({ page: String(p), q })
  return params.toString()
}

function parseSearchPageToken(pageToken: PageToken): { page: number; query: string } {
  if (typeof pageToken === 'number') {
    return { page: normalizePageToken(pageToken), query: '' }
  }

  const raw = String(pageToken ?? '').trim()
  if (!raw) return { page: 1, query: '' }

  // Support both raw numbers and querystring tokens.
  if (/^\d+$/.test(raw)) {
    return { page: normalizePageToken(raw), query: '' }
  }

  const params = new URLSearchParams(raw)
  const page = normalizePageToken(params.get('page') ?? 1)
  const query = (params.get('q') ?? '').trim()
  return { page, query }
}

function hashStringToSeed(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

let allItemsCache: FeedItem[] | null = null

function getAllItems(): FeedItem[] {
  if (allItemsCache) return allItemsCache
  const all: FeedItem[] = []
  for (let page = 1; page <= TOTAL_PAGES; page += 1) {
    for (let index = 0; index < ITEMS_PER_PAGE; index += 1) {
      all.push(createItem({ page, index }))
    }
  }
  allItemsCache = all
  return all
}

export async function fetchSearchPage(pageToken: PageToken): Promise<FetchPageResult> {
  const { page, query } = parseSearchPageToken(pageToken)
  if (page < 1) throw new Error('page out of range')

  const seed = (page * 1000 + hashStringToSeed(query)) >>> 0
  const rng = createRng(seed)
  const delayMs = randomInt(rng, 250, 800)
  await new Promise((resolve) => setTimeout(resolve, delayMs))

  const q = query.toLowerCase()
  const all = getAllItems()

  const filtered = q
    ? all.filter((it) => {
        return (
          it.id.toLowerCase().includes(q) ||
          it.type.toLowerCase().includes(q) ||
          it.preview.toLowerCase().includes(q) ||
          it.original.toLowerCase().includes(q)
        )
      })
    : all

  const start = (page - 1) * ITEMS_PER_PAGE
  const end = start + ITEMS_PER_PAGE
  const items = filtered.slice(start, end)

  const nextPageNumber = end < filtered.length ? page + 1 : null

  return {
    items,
    nextPage: nextPageNumber == null ? null : makeSearchPageToken({ page: nextPageNumber, query }),
  }
}

function normalizePageToken(pageToken: PageToken): number {
  if (typeof pageToken === 'number') {
    if (!Number.isInteger(pageToken)) throw new Error('page must be an integer')
    return pageToken
  }

  if (typeof pageToken === 'string') {
    const trimmed = pageToken.trim()
    const parsed = Number.parseInt(trimmed, 10)
    if (!Number.isFinite(parsed)) throw new Error('page must be a number-like string')
    return parsed
  }

  throw new Error('page must be a number or string')
}

function createNextPageToken(nextPageNumber: number | null): PageToken | null {
  if (nextPageNumber == null) return null
  return nextPageNumber % 2 === 0 ? String(nextPageNumber) : nextPageNumber
}

function createRng(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (1664525 * state + 1013904223) >>> 0
    return state / 2 ** 32
  }
}

function randomInt(rng: () => number, minInclusive: number, maxInclusive: number): number {
  return Math.floor(rng() * (maxInclusive - minInclusive + 1)) + minInclusive
}

function createItem({ page, index }: { page: number; index: number }): FeedItem {
  const seed = page * 1000 + index
  const rng = createRng(seed)

  const isForcedVideo = index === 0
  const isVideo = isForcedVideo || rng() < 0.25

  // width/height represent the preview dimensions used for layout.
  const width = randomInt(rng, 240, 520)
  const height = randomInt(rng, 180, 520)

  // "Original" media dimensions are simulated by requesting a much larger resource.
  const originalWidth = randomInt(rng, 900, 2600)
  const originalHeight = randomInt(rng, 700, 2200)

  const baseId = `p${page}-i${index}`

  if (isVideo) {
    const videoIndex = randomInt(rng, 0, VIDEO_SOURCES.length - 1)

    return {
      id: baseId,
      type: 'video',
      reaction: null,
      width,
      height,
      original: VIDEO_SOURCES[videoIndex],
      // For videos, preview is a poster image (thumbnail). In the demo we keep it deterministic
      // instead of using a random unrelated photo.
      preview: '/logo.svg',
    }
  }

  return {
    id: baseId,
    type: 'image',
    reaction: null,
    width,
    height,
    original: `https://picsum.photos/seed/vibe-${baseId}/${originalWidth}/${originalHeight}`,
    preview: `https://picsum.photos/seed/vibe-${baseId}/${width}/${height}`,
  }
}

export async function fetchPage(pageToken: PageToken): Promise<FetchPageResult> {
  const page = normalizePageToken(pageToken)
  if (page < 1 || page > TOTAL_PAGES) throw new Error('page out of range')

  const rng = createRng(page)
  const delayMs = randomInt(rng, 250, 800)

  await new Promise((resolve) => setTimeout(resolve, delayMs))

  const items = Array.from({ length: ITEMS_PER_PAGE }, (_, index) => createItem({ page, index }))

  const nextPageNumber = page < TOTAL_PAGES ? page + 1 : null

  return {
    items,
    nextPage: createNextPageToken(nextPageNumber),
  }
}
