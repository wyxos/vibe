const TOTAL_PAGES = 100
const ITEMS_PER_PAGE = 20

const VIDEO_SOURCES = [
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/bee.mp4',
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

export async function fetchPage(pageToken: PageToken): Promise<FetchPageResult> {
  const page = normalizePageToken(pageToken)
  if (page < 1 || page > TOTAL_PAGES) throw new Error('page out of range')

  const rng = createRng(page)
  const delayMs = randomInt(rng, 250, 800)

  await new Promise((resolve) => setTimeout(resolve, delayMs))

  const items = Array.from({ length: ITEMS_PER_PAGE }, (_, index) =>
    createItem({ page, index }),
  )

  const nextPageNumber = page < TOTAL_PAGES ? page + 1 : null

  return {
    items,
    nextPage: createNextPageToken(nextPageNumber),
  }
}
