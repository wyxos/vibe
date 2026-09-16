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

interface MasonryGrid {
  additionalHeight: number
  columns: number
  gap: number
  itemWidth: number
}

function resolveMasonryGrid(
  containerWidth: number,
  options: MasonryOptions,
): MasonryGrid | null {
  if (containerWidth <= 0) return null

  const gap = Math.max(0, options.gap)
  const additionalHeight = Number.isFinite(options.additionalHeight)
    ? Math.max(0, options.additionalHeight ?? 0)
    : 0
  const minColumnWidth = Math.max(1, options.minColumnWidth)
  const columns = Math.max(
    1,
    Math.floor((containerWidth + gap) / (minColumnWidth + gap)),
  )
  return {
    additionalHeight,
    columns,
    gap,
    itemWidth: (containerWidth - gap * (columns - 1)) / columns,
  }
}

function packMasonryItem(
  item: MasonryMediaDimensions,
  columnHeights: number[],
  grid: MasonryGrid,
): MasonryPosition {
  const column = shortestColumn(columnHeights)
  const height = grid.itemWidth * itemAspectRatio(item) + grid.additionalHeight
  const position = {
    x: column * (grid.itemWidth + grid.gap),
    y: columnHeights[column]!,
    width: grid.itemWidth,
    height,
  }
  columnHeights[column]! += height + grid.gap
  return position
}

function columnHeightsFromPrefix(
  prefix: readonly MasonryPosition[],
  grid: MasonryGrid,
): number[] {
  const columnHeights = Array.from({ length: grid.columns }, () => 0)
  const stride = grid.itemWidth + grid.gap
  prefix.forEach((position) => {
    const column = stride === 0 ? 0 : Math.round(position.x / stride)
    if (column < 0 || column >= grid.columns) return
    columnHeights[column] = Math.max(
      columnHeights[column]!,
      position.y + position.height + grid.gap,
    )
  })
  return columnHeights
}

function masonryHeight(columnHeights: readonly number[], gap: number): number {
  if (columnHeights.length === 0) return 0
  return Math.max(0, Math.max(...columnHeights) - gap)
}

export function calculateMasonryLayout(
  media: readonly MasonryMediaDimensions[],
  containerWidth: number,
  options: MasonryOptions,
): MasonryLayout {
  const grid = resolveMasonryGrid(containerWidth, options)
  if (!grid || media.length === 0) {
    return { columns: 0, height: 0, items: [] }
  }

  const columnHeights = Array.from({ length: grid.columns }, () => 0)
  const items = media.map((item) => packMasonryItem(item, columnHeights, grid))
  return {
    columns: grid.columns,
    height: masonryHeight(columnHeights, grid.gap),
    items,
  }
}

export function continueMasonryLayout(
  media: readonly MasonryMediaDimensions[],
  containerWidth: number,
  options: MasonryOptions,
  previous: MasonryLayout,
  fromIndex: number,
): MasonryLayout {
  const grid = resolveMasonryGrid(containerWidth, options)
  if (!grid || media.length === 0) {
    return { columns: 0, height: 0, items: [] }
  }
  if (
    fromIndex <= 0
    || previous.columns !== grid.columns
    || previous.items.length < fromIndex
  ) {
    return calculateMasonryLayout(media, containerWidth, options)
  }

  const items = previous.items.slice(0, fromIndex)
  const columnHeights = columnHeightsFromPrefix(items, grid)
  for (let index = fromIndex; index < media.length; index += 1) {
    items.push(packMasonryItem(media[index]!, columnHeights, grid))
  }
  return {
    columns: grid.columns,
    height: masonryHeight(columnHeights, grid.gap),
    items,
  }
}

export function projectMasonryLayout(
  media: readonly MasonryMediaDimensions[],
  containerWidth: number,
  options: MasonryOptions,
  settled: MasonryLayout,
  skip: (index: number) => boolean,
): MasonryLayout & { retainedIndices: number[] } {
  const grid = resolveMasonryGrid(containerWidth, options)
  if (!grid || media.length === 0) {
    return { columns: 0, height: 0, items: [], retainedIndices: [] }
  }

  if (settled.items.length !== media.length || settled.columns !== grid.columns) {
    const retainedIndices = media.map((_, index) => index).filter((index) => !skip(index))
    const packed = calculateMasonryLayout(
      retainedIndices.map((index) => media[index]!),
      containerWidth,
      options,
    )
    const items = media.map((_, index) => settled.items[index] ?? {
      height: 0,
      width: 0,
      x: 0,
      y: 0,
    })
    retainedIndices.forEach((index, packedIndex) => {
      items[index] = packed.items[packedIndex]!
    })
    return {
      columns: packed.columns,
      height: packed.height,
      items,
      retainedIndices,
    }
  }

  let fromIndex = 0
  while (fromIndex < media.length && !skip(fromIndex)) fromIndex += 1
  if (fromIndex >= media.length) {
    return {
      ...settled,
      retainedIndices: media.map((_, index) => index),
    }
  }

  const items = settled.items.slice()
  const retainedIndices: number[] = []
  for (let index = 0; index < fromIndex; index += 1) retainedIndices.push(index)
  const columnHeights = columnHeightsFromPrefix(items.slice(0, fromIndex), grid)
  for (let index = fromIndex; index < media.length; index += 1) {
    if (skip(index)) continue
    items[index] = packMasonryItem(media[index]!, columnHeights, grid)
    retainedIndices.push(index)
  }
  return {
    columns: grid.columns,
    height: masonryHeight(columnHeights, grid.gap),
    items,
    retainedIndices,
  }
}
