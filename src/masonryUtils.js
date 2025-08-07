/**
 * Get responsive column count based on window width and layout sizes
 */
export function getColumnCount(layout) {
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
export function calculateContainerHeight(items) {
  const contentHeight = items.reduce((acc, item) => {
    return Math.max(acc, item.top + item.columnHeight)
  }, 0)
  
  // Add 500px buffer to the container height
  return contentHeight + 500
}

/**
 * Get style object for masonry item positioning
 */
export function getItemStyle(item) {
  return {
    top: `${item.top}px`,
    left: `${item.left}px`,
    width: `${item.columnWidth}px`,
    height: `${item.columnHeight}px`
  }
}

/**
 * Get item attributes for rendering
 */
export function getItemAttributes(item) {
  return {
    style: getItemStyle(item),
    'data-top': item.top,
    'data-id': `${item.page}-${item.id}`,
  }
}

/**
 * Calculate column heights for masonry layout
 */
export function calculateColumnHeights(items, columnCount) {
  const heights = new Array(columnCount).fill(0)
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const col = i % columnCount
    heights[col] = Math.max(heights[col], item.top + item.columnHeight)
  }
  return heights
}
