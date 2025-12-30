const TOTAL_PAGES = 100
const ITEMS_PER_PAGE = 20

const VIDEO_SOURCES = [
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/bee.mp4',
]

function normalizePageToken(pageToken) {
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

function createNextPageToken(nextPageNumber) {
  if (nextPageNumber == null) return null
  return nextPageNumber % 2 === 0 ? String(nextPageNumber) : nextPageNumber
}

function createRng(seed) {
  let state = seed >>> 0
  return () => {
    state = (1664525 * state + 1013904223) >>> 0
    return state / 2 ** 32
  }
}

function randomInt(rng, minInclusive, maxInclusive) {
  return Math.floor(rng() * (maxInclusive - minInclusive + 1)) + minInclusive
}

function createItem({ page, index }) {
  const seed = page * 1000 + index
  const rng = createRng(seed)

  const isForcedVideo = index === 0
  const isVideo = isForcedVideo || rng() < 0.25

  const width = randomInt(rng, 240, 520)
  const height = randomInt(rng, 180, 520)

  const baseId = `p${page}-i${index}`

  if (isVideo) {
    const videoIndex = randomInt(rng, 0, VIDEO_SOURCES.length - 1)

    return {
      id: baseId,
      type: 'video',
      width,
      height,
      src: VIDEO_SOURCES[videoIndex],
      poster: `https://picsum.photos/seed/vibe-${baseId}/${width}/${height}`,
    }
  }

  return {
    id: baseId,
    type: 'image',
    width,
    height,
    src: `https://picsum.photos/seed/vibe-${baseId}/${width}/${height}`,
  }
}

export async function fetchPage(pageToken) {
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
