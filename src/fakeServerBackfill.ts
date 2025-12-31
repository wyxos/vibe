const TOTAL_PAGES = 100
const ITEMS_PER_PAGE = 20

const VIDEO_SOURCES = [
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/bee.mp4',
]

export type PageToken = string | number

export type BackfillFeedItemType = 'image' | 'video'

export interface BackfillFeedItem {
  id: string
  type: BackfillFeedItemType
  reaction: string | null
  width: number
  height: number
  original: string
  preview: string
  [key: string]: unknown
}

export interface FetchBackfillPageResult {
  items: BackfillFeedItem[]
  nextPage: PageToken | null
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

function createItem({ page, index }: { page: number; index: number }): BackfillFeedItem {
  const seed = page * 1000 + index
  const rng = createRng(seed)

  const isForcedVideo = index === 0
  const isVideo = isForcedVideo || rng() < 0.25

  const width = randomInt(rng, 240, 520)
  const height = randomInt(rng, 180, 520)

  const originalWidth = randomInt(rng, 900, 2600)
  const originalHeight = randomInt(rng, 700, 2200)

  const baseId = `bf-p${page}-i${index}`

  if (isVideo) {
    const videoIndex = randomInt(rng, 0, VIDEO_SOURCES.length - 1)

    return {
      id: baseId,
      type: 'video',
      reaction: null,
      width,
      height,
      original: VIDEO_SOURCES[videoIndex],
      preview: `https://picsum.photos/seed/vibe-${baseId}/${width}/${height}`,
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

function shortPageSizeFor(page: number): number {
  // Deterministic (seeded) random short pages to simulate filtering/moderation/seen-items.
  // Always returns 0..ITEMS_PER_PAGE and never more than the page size.
  // Intentionally biased toward smaller pages to exercise backfill more often.
  const rng = createRng(page * 97_409)
  const roll = rng()

  // ~20% chance of empty page.
  if (roll < 0.2) return 0

  // ~55% chance of a small page (1..10).
  if (roll < 0.75) return randomInt(rng, 1, Math.min(10, ITEMS_PER_PAGE))

  // ~20% chance of a medium page (11..ITEMS_PER_PAGE-1).
  if (roll < 0.95)
    return randomInt(rng, Math.min(11, ITEMS_PER_PAGE), Math.max(11, ITEMS_PER_PAGE - 1))

  // ~5% chance of a full page.
  return ITEMS_PER_PAGE
}

export async function fetchBackfillPage(pageToken: PageToken): Promise<FetchBackfillPageResult> {
  const page = normalizePageToken(pageToken)
  if (page < 1 || page > TOTAL_PAGES) throw new Error('page out of range')

  // Fast deterministic delay; keeps the demo feeling async.
  const delayMs = 1000
  await new Promise((resolve) => setTimeout(resolve, delayMs))

  const size = shortPageSizeFor(page)
  const items = Array.from({ length: size }, (_, index) => createItem({ page, index }))

  const nextPageNumber = page < TOTAL_PAGES ? page + 1 : null

  return {
    items,
    nextPage: createNextPageToken(nextPageNumber),
  }
}
