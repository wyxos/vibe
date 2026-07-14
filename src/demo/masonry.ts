export interface MasonryMediaDimensions {
  width: number | null
  height: number | null
  preview: {
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

interface MasonryOptions {
  gap: number
  minColumnWidth: number
}

function itemAspectRatio(item: MasonryMediaDimensions): number {
  const width = item.preview.width ?? item.width
  const height = item.preview.height ?? item.height

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

    if (itemBottom >= viewportTop && item.y <= viewportBottom) {
      indices.push(index)
    }

    return indices
  }, [])
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
  const minColumnWidth = Math.max(1, options.minColumnWidth)
  const columns = Math.max(
    1,
    Math.floor((containerWidth + gap) / (minColumnWidth + gap)),
  )
  const itemWidth = (containerWidth - gap * (columns - 1)) / columns
  const columnHeights = Array.from({ length: columns }, () => 0)

  const items = media.map((item) => {
    const column = shortestColumn(columnHeights)
    const height = itemWidth * itemAspectRatio(item)
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
