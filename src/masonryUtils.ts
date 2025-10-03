import type { LayoutOptions, ProcessedMasonryItem } from './types'

/**
 * Get responsive column count based on window width and layout sizes
 */
export function getColumnCount(layout: Pick<LayoutOptions, 'sizes'> & { sizes: Required<NonNullable<LayoutOptions['sizes']>> }): number {
  const width = window.innerWidth
  const sizes = layout.sizes

  if (width >= 1536 && sizes['2xl']) return sizes['2xl']
  if (width >= 1280 && sizes.xl) return sizes.xl
  if (width >= 1024 && sizes.lg) return sizes.lg
  if (width >= 768 && sizes.md) return sizes.md
  if (width >= 640 && sizes.sm) return sizes.sm
  return sizes.base
}

/**
 * Calculate container height based on item positions
 */
export function calculateContainerHeight(items: ProcessedMasonryItem[]): number {
  const contentHeight = items.reduce((acc, item) => {
    return Math.max(acc, item.top + item.columnHeight)
  }, 0)
  return contentHeight + 500
}

/**
 * Get style object for masonry item positioning
 */
export function getItemStyle(item: ProcessedMasonryItem): Record<string, string> {
  return {
    transform: `translate3d(${item.left}px, ${item.top}px, 0)` ,
    top: '0px',
    left: '0px',
    width: `${item.columnWidth}px`,
    height: `${item.columnHeight}px`
  }
}

/**
 * Get item attributes for rendering
 */
export function getItemAttributes(item: ProcessedMasonryItem, index: number = 0): Record<string, any> {
  return {
    style: getItemStyle(item),
    'data-top': item.top,
    'data-left': item.left,
    'data-id': `${(item as any).page}-${(item as any).id}`,
    'data-index': index,
  }
}

/**
 * Calculate column heights for masonry layout
 */
export function calculateColumnHeights(items: ProcessedMasonryItem[], columnCount: number): number[] {
  // Derive columns by actual left positions to reflect shortest-column placement
  if (!items.length || columnCount <= 0) {
    return new Array<number>(Math.max(1, columnCount)).fill(0)
  }
  // Unique lefts (sorted) represent the columns in visual order
  const uniqueLefts = Array.from(new Set(items.map(i => i.left))).sort((a, b) => a - b)
  const limitedLefts = uniqueLefts.slice(0, columnCount)
  const leftIndexMap = new Map<number, number>()
  for (let idx = 0; idx < limitedLefts.length; idx++) leftIndexMap.set(limitedLefts[idx], idx)

  const heights = new Array<number>(limitedLefts.length).fill(0)
  for (const it of items) {
    const col = leftIndexMap.get(it.left)
    if (col != null) {
      heights[col] = Math.max(heights[col], it.top + it.columnHeight)
    }
  }
  // Pad if some columns haven't been populated yet (e.g., initial render)
  while (heights.length < columnCount) heights.push(0)
  return heights
}
