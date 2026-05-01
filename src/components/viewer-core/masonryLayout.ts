import type { VibeViewerItem } from '../viewer'
import { getVibeOccurrenceKey } from './itemIdentity'

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
  columnHeights: number[]
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
  const layout = { positions, heights, buckets, contentHeight: 0, indexById, columnHeights }

  appendMasonryLayoutItems(layout, items, {
    ...options,
    startIndex: 0,
  })

  return layout
}

export function appendMasonryLayoutItems(
  layout: VibeMasonryLayoutResult,
  items: VibeViewerItem[],
  options: {
    columnCount: number
    columnWidth: number
    gapX: number
    gapY: number
    bucketPx: number
    startIndex: number
    positionOffsetX?: number
    positionOffsetY?: number
  },
): VibeMasonryLayoutResult {
  for (let offset = 0; offset < items.length; offset += 1) {
    const item = items[offset]
    const index = options.startIndex + offset
    layout.indexById.set(getVibeOccurrenceKey(item), index)

    let bestColumn = 0
    for (let column = 1; column < layout.columnHeights.length; column += 1) {
      if (layout.columnHeights[column] < layout.columnHeights[bestColumn]) {
        bestColumn = column
      }
    }

    const x = bestColumn * (options.columnWidth + options.gapX)
    const y = layout.columnHeights[bestColumn]
    const height = estimateItemHeight(item, options.columnWidth)

    layout.positions[index] = {
      x: x + (options.positionOffsetX ?? 0),
      y: y + (options.positionOffsetY ?? 0),
    }
    layout.heights[index] = height
    layout.columnHeights[bestColumn] = y + height + options.gapY
    layout.contentHeight = Math.max(layout.contentHeight, y + height)

    const startBucket = Math.floor(y / options.bucketPx)
    const endBucket = Math.floor((y + height) / options.bucketPx)

    for (let bucket = startBucket; bucket <= endBucket; bucket += 1) {
      const nextIndices = layout.buckets.get(bucket)
      if (nextIndices) {
        layout.buckets.set(bucket, [...nextIndices, index])
      }
      else {
        layout.buckets.set(bucket, [index])
      }
    }
  }

  return layout
}

export function estimateMasonryAppendContentHeight(
  items: VibeViewerItem[],
  options: {
    columnHeights: number[]
    columnWidth: number
    contentHeight: number
    gapY: number
  },
) {
  const columnHeights = [...options.columnHeights]
  let contentHeight = options.contentHeight

  for (const item of items) {
    let bestColumn = 0
    for (let column = 1; column < columnHeights.length; column += 1) {
      if (columnHeights[column] < columnHeights[bestColumn]) {
        bestColumn = column
      }
    }

    const y = columnHeights[bestColumn]
    const height = estimateItemHeight(item, options.columnWidth)
    columnHeights[bestColumn] = y + height + options.gapY
    contentHeight = Math.max(contentHeight, y + height)
  }

  return contentHeight
}

export function canAppendMasonryLayout(options: {
  addedItems: VibeViewerItem[]
  columnCount: number
  columnHeights: number[]
  currentItems: VibeViewerItem[]
  isPrepend: boolean
  layoutItemCount: number
  previousItems: VibeViewerItem[]
  removedItemCount: number
}) {
  if (
    options.addedItems.length === 0
    || options.removedItemCount > 0
    || options.isPrepend
    || options.previousItems.length === 0
    || options.layoutItemCount !== options.previousItems.length
    || options.columnHeights.length !== options.columnCount
    || options.currentItems.length !== options.previousItems.length + options.addedItems.length
  ) {
    return false
  }

  return options.previousItems.every((item, index) => (
    getVibeOccurrenceKey(item) === getVibeOccurrenceKey(options.currentItems[index])
  ))
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
    const index = indexById.get(getVibeOccurrenceKey(item))
    if (index == null) {
      continue
    }

    const position = positions[index]
    if (position) {
      snapshot.set(getVibeOccurrenceKey(item), position)
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
