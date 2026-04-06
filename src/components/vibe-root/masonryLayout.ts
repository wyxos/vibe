import type { VibeViewerItem } from '../vibeViewer'

export type LayoutPosition = {
  x: number
  y: number
}

export interface VibeMasonryDimensions {
  width: number
  height: number
  source: 'preview' | 'original' | 'fallback'
}

export interface VibeMasonryLayoutResult {
  positions: LayoutPosition[]
  heights: number[]
  buckets: Map<number, number[]>
  contentHeight: number
  indexById: Map<string, number>
}

const FALLBACK_SIZE = 1
const WIDE_IMAGE_MIN_ASPECT_RATIO = 0.5

export function getMasonryDimensions(item: VibeViewerItem): VibeMasonryDimensions {
  if (item.type !== 'image' && item.type !== 'video') {
    return {
      width: FALLBACK_SIZE,
      height: FALLBACK_SIZE,
      source: 'fallback',
    }
  }

  const previewWidth = item.preview?.width
  const previewHeight = item.preview?.height

  if (isValidDimension(previewWidth) && isValidDimension(previewHeight)) {
    const normalizedPreviewDimensions = normalizeImageDimensions(item, previewWidth, previewHeight)

    return {
      width: normalizedPreviewDimensions.width,
      height: normalizedPreviewDimensions.height,
      source: 'preview',
    }
  }

  if (isValidDimension(item.width) && isValidDimension(item.height)) {
    const normalizedOriginalDimensions = normalizeImageDimensions(item, item.width, item.height)

    return {
      width: normalizedOriginalDimensions.width,
      height: normalizedOriginalDimensions.height,
      source: 'original',
    }
  }

  return {
    width: FALLBACK_SIZE,
    height: FALLBACK_SIZE,
    source: 'fallback',
  }
}

export function getColumnCount(containerWidth: number, itemWidth: number) {
  if (!containerWidth || containerWidth <= 0 || !itemWidth || itemWidth <= 0) {
    return 1
  }

  return Math.max(1, Math.floor(containerWidth / itemWidth))
}

export function getColumnWidth(containerWidth: number, columnCount: number, fallbackItemWidth: number, gapX = 0) {
  if (!containerWidth || containerWidth <= 0 || !columnCount || columnCount <= 0) {
    return fallbackItemWidth
  }

  const safeGap = typeof gapX === 'number' && gapX > 0 ? gapX : 0
  const usableWidth = containerWidth - Math.max(0, columnCount - 1) * safeGap

  if (!usableWidth || usableWidth <= 0) {
    return fallbackItemWidth
  }

  return usableWidth / columnCount
}

export function estimateItemHeight(item: VibeViewerItem, columnWidth: number) {
  const dimensions = getMasonryDimensions(item)
  return (dimensions.height / dimensions.width) * columnWidth
}

export function buildMasonryLayout(
  items: VibeViewerItem[],
  options: {
    columnCount: number
    columnWidth: number
    gapX: number
    gapY: number
    bucketPx: number
  },
): VibeMasonryLayoutResult {
  const columnHeights = Array.from({ length: options.columnCount }, () => 0)
  const positions: LayoutPosition[] = new Array(items.length)
  const heights: number[] = new Array(items.length)
  const buckets = new Map<number, number[]>()
  const indexById = new Map<string, number>()

  let contentHeight = 0

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index]
    indexById.set(item.id, index)

    let bestColumn = 0
    for (let column = 1; column < columnHeights.length; column += 1) {
      if (columnHeights[column] < columnHeights[bestColumn]) {
        bestColumn = column
      }
    }

    const x = bestColumn * (options.columnWidth + options.gapX)
    const y = columnHeights[bestColumn]
    const height = estimateItemHeight(item, options.columnWidth)

    positions[index] = { x, y }
    heights[index] = height
    columnHeights[bestColumn] = y + height + options.gapY
    contentHeight = Math.max(contentHeight, y + height)

    const startBucket = Math.floor(y / options.bucketPx)
    const endBucket = Math.floor((y + height) / options.bucketPx)

    for (let bucket = startBucket; bucket <= endBucket; bucket += 1) {
      const nextIndices = buckets.get(bucket)
      if (nextIndices) {
        nextIndices.push(index)
      }
      else {
        buckets.set(bucket, [index])
      }
    }
  }

  return {
    positions,
    heights,
    buckets,
    contentHeight,
    indexById,
  }
}

export function getVisibleIndicesFromBuckets(options: {
  itemCount: number
  viewportHeight: number
  scrollTop: number
  overscanPx: number
  bucketPx: number
  buckets: Map<number, number[]>
}) {
  if (options.itemCount <= 0) {
    return []
  }

  if (options.viewportHeight <= 0) {
    return Array.from({ length: options.itemCount }, (_, index) => index)
  }

  const startY = Math.max(0, options.scrollTop - options.overscanPx)
  const endY = options.scrollTop + options.viewportHeight + options.overscanPx
  const startBucket = Math.floor(startY / options.bucketPx)
  const endBucket = Math.floor(endY / options.bucketPx)
  const visibleIndices = new Set<number>()

  for (let bucket = startBucket; bucket <= endBucket; bucket += 1) {
    const bucketIndices = options.buckets.get(bucket)
    if (!bucketIndices) {
      continue
    }

    for (const index of bucketIndices) {
      visibleIndices.add(index)
    }
  }

  return Array.from(visibleIndices).sort((left, right) => left - right)
}

export function snapshotPositionsById(items: VibeViewerItem[], indexById: Map<string, number>, positions: LayoutPosition[]) {
  const snapshot = new Map<string, LayoutPosition>()

  for (const item of items) {
    const index = indexById.get(item.id)
    if (index == null) {
      continue
    }

    const position = positions[index]
    if (position) {
      snapshot.set(item.id, position)
    }
  }

  return snapshot
}

function isValidDimension(value: number | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

function normalizeImageDimensions(item: VibeViewerItem, width: number, height: number) {
  if (item.type !== 'image') {
    return {
      width,
      height,
    }
  }

  if (height / width >= WIDE_IMAGE_MIN_ASPECT_RATIO) {
    return {
      width,
      height,
    }
  }

  return {
    width,
    height: width,
  }
}
