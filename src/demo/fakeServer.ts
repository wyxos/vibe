const FIXTURE_PAGE_COUNT = 10
const PREVIEW_MAX_WIDTH = 450

export type FakeMediaCursor = string | number | null | undefined

export interface FakeMediaPreview {
  src: string
  width: number | null
  height: number | null
}

export interface FakeMediaAsset {
  src: string
  preview: FakeMediaPreview
  width: number | null
  height: number | null
}

export interface FakeMediaItem extends FakeMediaAsset {
  postId: number
  items: FakeMediaAsset[]
}

export interface FakeMediaPage {
  items: FakeMediaItem[]
  meta: {
    next: string | null
    total: number
  }
}

interface FixtureItem {
  url: string
  postId?: number | null
  width?: number | null
  height?: number | null
}

interface FixturePage {
  items: FixtureItem[]
  metadata: {
    nextCursor?: string | null
  }
}

interface FetchResponse {
  ok: boolean
  status: number
  json: () => Promise<unknown>
}

export type FakeMediaFetch = (url: string) => Promise<FetchResponse>

interface FixtureDataset {
  itemsByPage: Map<number, FakeMediaItem[]>
  total: number
}

function fixtureUrl(page: number): string {
  const filename = `page-${String(page).padStart(2, '0')}.json`

  return `${import.meta.env.BASE_URL}data/civitai/images/${filename}`
}

function isFixturePage(value: unknown): value is FixturePage {
  if (!value || typeof value !== 'object') return false

  const candidate = value as Partial<FixturePage>

  return Array.isArray(candidate.items)
    && Boolean(candidate.metadata)
    && typeof candidate.metadata === 'object'
}

function sourceDimension(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : null
}

function previewUrl(src: string): string {
  return src.replace('/original=true/', `/width=${PREVIEW_MAX_WIDTH}/`)
}

function previewDimensions(
  width: number | null,
  height: number | null,
): Pick<FakeMediaPreview, 'width' | 'height'> {
  if (width === null || height === null) {
    return { width: null, height: null }
  }

  const previewWidth = Math.min(width, PREVIEW_MAX_WIDTH)

  return {
    width: previewWidth,
    height: Math.round(height * (previewWidth / width)),
  }
}

function normalizeItem(item: FixtureItem): FakeMediaAsset {
  const width = sourceDimension(item.width)
  const height = sourceDimension(item.height)

  return {
    src: item.url,
    preview: {
      src: previewUrl(item.url),
      ...previewDimensions(width, height),
    },
    width,
    height,
  }
}

function numericPage(cursor: FakeMediaCursor): number | null {
  if (cursor === null || cursor === undefined || cursor === '') return 1

  const value = typeof cursor === 'number'
    ? cursor
    : /^\d+$/.test(cursor) ? Number(cursor) : null

  if (value === null) return null
  if (!Number.isInteger(value) || value < 1 || value > FIXTURE_PAGE_COUNT) {
    throw new RangeError(`Fixture page must be between 1 and ${FIXTURE_PAGE_COUNT}`)
  }

  return value
}

export function createFakeMediaServer(
  fetcher: FakeMediaFetch = (url) => fetch(url),
) {
  const pageCache = new Map<number, Promise<FixturePage>>()
  const cursorPages = new Map<string, number>()
  let datasetRequest: Promise<FixtureDataset> | null = null

  async function loadFixture(page: number): Promise<FixturePage> {
    const cached = pageCache.get(page)
    if (cached) return cached

    const request = fetcher(fixtureUrl(page)).then(async (response) => {
      if (!response.ok) {
        throw new Error(`Fake media fixture ${page} failed with status ${response.status}`)
      }

      const value: unknown = await response.json()
      if (!isFixturePage(value)) {
        throw new TypeError(`Fake media fixture ${page} has an invalid response shape`)
      }

      if (page < FIXTURE_PAGE_COUNT && value.metadata.nextCursor) {
        cursorPages.set(value.metadata.nextCursor, page + 1)
      }

      return value
    })

    pageCache.set(page, request)

    return request
  }

  async function loadDataset(): Promise<FixtureDataset> {
    if (datasetRequest) return datasetRequest

    datasetRequest = Promise.all(
      Array.from(
        { length: FIXTURE_PAGE_COUNT },
        (_, index) => loadFixture(index + 1),
      ),
    ).then((fixtures) => {
      const itemsByPage = new Map<number, FakeMediaItem[]>()
      const itemsByPost = new Map<number, FakeMediaItem>()

      fixtures.forEach((fixture, index) => {
        const page = index + 1

        fixture.items.forEach((item) => {
          if (typeof item.postId !== 'number') {
            throw new TypeError(`Fake media fixture ${page} contains an item without a postId`)
          }

          const media = normalizeItem(item)
          const primary = itemsByPost.get(item.postId)

          if (!primary) {
            const feedItem: FakeMediaItem = {
              postId: item.postId,
              ...media,
              items: [],
            }
            itemsByPost.set(item.postId, feedItem)

            const pageItems = itemsByPage.get(page) ?? []
            pageItems.push(feedItem)
            itemsByPage.set(page, pageItems)
          } else {
            primary.items.push(media)
          }
        })
      })

      return {
        itemsByPage,
        total: itemsByPost.size,
      }
    })

    return datasetRequest
  }

  function cursorPage(cursor: string): number {
    const page = cursorPages.get(cursor)
    if (!page) {
      throw new RangeError('Unknown or exhausted fake media cursor')
    }

    return page
  }

  return async function getMediaPage(cursor?: FakeMediaCursor): Promise<FakeMediaPage> {
    const dataset = await loadDataset()
    const page = numericPage(cursor)
      ?? cursorPage(String(cursor))
    const fixture = await loadFixture(page)

    return {
      items: dataset.itemsByPage.get(page) ?? [],
      meta: {
        next: page < FIXTURE_PAGE_COUNT
          ? fixture.metadata.nextCursor ?? null
          : null,
        total: dataset.total,
      },
    }
  }
}

export const getFakeMediaPage = createFakeMediaServer()
