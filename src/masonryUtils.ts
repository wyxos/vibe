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
  const heights = new Array<number>(columnCount).fill(0)
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const col = i % columnCount
    heights[col] = Math.max(heights[col], item.top + item.columnHeight)
  }
  return heights
}
