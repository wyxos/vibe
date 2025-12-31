import { estimateItemHeight } from './layout'

export type LayoutPosition = { x: number; y: number }

export type MasonryLayoutResult = {
  positions: LayoutPosition[]
  heights: number[]
  buckets: Map<number, number[]>
  contentHeight: number
  indexById: Map<string, number>
}

export function buildMasonryLayout<TItem extends { id?: string; width: number; height: number }>(
  options: {
    items: TItem[]
    columnCount: number
    columnWidth: number
    gapX: number
    gapY: number
    headerHeight: number
    footerHeight: number
    bucketPx: number
  }
): MasonryLayoutResult {
  const count = options.columnCount
  const colWidth = options.columnWidth
  const gx = options.gapX
  const gy = options.gapY
  const hh = options.headerHeight
  const fh = options.footerHeight
  const bucketPx = options.bucketPx

  const colHeights = Array.from({ length: count }, () => 0)
  const positions: LayoutPosition[] = new Array(options.items.length)
  const heights: number[] = new Array(options.items.length)
  const buckets = new Map<number, number[]>()
  const indexById = new Map<string, number>()

  let maxY = 0

  // Sequential placement into the shortest column gives a masonry layout while
  // preserving a single DOM sequence (no re-parenting on removal).
  for (let index = 0; index < options.items.length; index += 1) {
    const item = options.items[index]
    if (item?.id) indexById.set(item.id, index)

    let bestCol = 0
    for (let c = 1; c < colHeights.length; c += 1) {
      if (colHeights[c] < colHeights[bestCol]) bestCol = c
    }

    const x = bestCol * (colWidth + gx)
    const y = colHeights[bestCol]
    const h = estimateItemHeight(item, colWidth) + hh + fh

    positions[index] = { x, y }
    heights[index] = h

    colHeights[bestCol] = y + h + gy
    maxY = Math.max(maxY, y + h)

    // Virtualization buckets by y-range.
    const startBucket = Math.floor(y / bucketPx)
    const endBucket = Math.floor((y + h) / bucketPx)
    for (let b = startBucket; b <= endBucket; b += 1) {
      const arr = buckets.get(b)
      if (arr) arr.push(index)
      else buckets.set(b, [index])
    }
  }

  return { positions, heights, buckets, contentHeight: maxY, indexById }
}

export function getVisibleIndicesFromBuckets(options: {
  itemCount: number
  viewportHeight: number
  scrollTop: number
  overscanPx: number
  bucketPx: number
  buckets: Map<number, number[]>
}): number[] {
  const len = options.itemCount
  if (!len) return []

  // In jsdom/tests, element sizing is often 0. Render all items.
  if (options.viewportHeight <= 0) return Array.from({ length: len }, (_, i) => i)

  const startY = Math.max(0, options.scrollTop - options.overscanPx)
  const endY = options.scrollTop + options.viewportHeight + options.overscanPx

  const startBucket = Math.floor(startY / options.bucketPx)
  const endBucket = Math.floor(endY / options.bucketPx)

  const picked = new Set<number>()
  for (let b = startBucket; b <= endBucket; b += 1) {
    const bucket = options.buckets.get(b)
    if (!bucket) continue
    for (const idx of bucket) picked.add(idx)
  }

  const ordered = Array.from(picked)
  ordered.sort((a, b) => a - b)
  return ordered
}
