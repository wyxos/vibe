export interface MasonryMediaDimensions {
  width: number | null
  height: number | null
  preview?: {
    width: number | null
    height: number | null
  }
}

export interface MasonryPosition {
  x: number
  y: number
  width: number
  height: number
}

export interface MasonryLayout {
  columns: number
  height: number
  items: MasonryPosition[]
}

export interface MasonryEntryOptions {
  containerHeight: number
  gap: number
}

export interface MasonryViewportOptions {
  scrollTop: number
  viewportHeight: number
  overscan: number
}

export interface MasonryVisibilityOptions {
  scrollTop: number
  viewportHeight: number
}

interface MasonryOptions {
  additionalHeight?: number
  gap: number
  minColumnWidth: number
}

function itemAspectRatio(item: MasonryMediaDimensions): number {
  const width = item.preview?.width ?? item.width
  const height = item.preview?.height ?? item.height

  if (!width || !height || width <= 0 || height <= 0) return 1

  return height / width
}

function shortestColumn(columnHeights: number[]): number {
  return columnHeights.reduce(
    (shortest, height, index) => height < columnHeights[shortest]
      ? index
      : shortest,
    0,
  )
}

export function calculateMasonryEntryOffset(
  options: MasonryEntryOptions,
): number {
  return Math.max(0, options.containerHeight)
    + Math.max(0, options.gap)
}

export function calculateVisibleMasonryIndices(
  items: MasonryPosition[],
  options: MasonryViewportOptions,
): number[] {
  const overscan = Math.max(0, options.overscan)
  const viewportTop = options.scrollTop - overscan
  const viewportBottom = options.scrollTop
    + Math.max(0, options.viewportHeight)
    + overscan

  return items.reduce<number[]>((indices, item, index) => {
    const itemBottom = item.y + item.height

    if (itemBottom > viewportTop && item.y < viewportBottom) {
      indices.push(index)
    }

    return indices
  }, [])
}

const TALL_ITEM_VISIBLE_RATIO = 0.8
const VISIBILITY_EPSILON = 0.5

export function calculateFullyVisibleMasonryIndices(
  items: readonly MasonryPosition[],
  candidates: readonly number[],
  options: MasonryVisibilityOptions,
): number[] {
  const viewportHeight = Math.max(0, options.viewportHeight)
  if (viewportHeight === 0) return []

  const viewportTop = options.scrollTop
  const viewportBottom = viewportTop + viewportHeight
  return candidates.filter((index) => {
    const item = items[index]
    if (!item || item.height <= 0) return false

    const visibleHeight = Math.max(0, Math.min(
      item.y + item.height,
      viewportBottom,
    ) - Math.max(item.y, viewportTop))
    const requiredHeight = item.height <= viewportHeight
      ? item.height
      : viewportHeight * TALL_ITEM_VISIBLE_RATIO
    return visibleHeight + VISIBILITY_EPSILON >= requiredHeight
  })
}

export function calculateMasonryLayout(
  media: readonly MasonryMediaDimensions[],
  containerWidth: number,
  options: MasonryOptions,
): MasonryLayout {
  if (containerWidth <= 0 || media.length === 0) {
    return { columns: 0, height: 0, items: [] }
  }

  const gap = Math.max(0, options.gap)
  const additionalHeight = Number.isFinite(options.additionalHeight)
    ? Math.max(0, options.additionalHeight ?? 0)
    : 0
  const minColumnWidth = Math.max(1, options.minColumnWidth)
  const columns = Math.max(
    1,
    Math.floor((containerWidth + gap) / (minColumnWidth + gap)),
  )
  const itemWidth = (containerWidth - gap * (columns - 1)) / columns
  const columnHeights = Array.from({ length: columns }, () => 0)

  const items = media.map((item) => {
    const column = shortestColumn(columnHeights)
    const height = itemWidth * itemAspectRatio(item) + additionalHeight
    const position = {
      x: column * (itemWidth + gap),
      y: columnHeights[column],
      width: itemWidth,
      height,
    }

    columnHeights[column] += height + gap

    return position
  })

  return {
    columns,
    height: Math.max(...columnHeights) - gap,
    items,
  }
}
