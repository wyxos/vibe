export function getColumnCount(containerWidth: number, itemWidth: number): number {
  if (!containerWidth || containerWidth <= 0) return 1
  if (!itemWidth || itemWidth <= 0) return 1
  return Math.max(1, Math.floor(containerWidth / itemWidth))
}

export function getColumnWidth(
  containerWidth: number,
  columnCount: number,
  fallbackItemWidth: number,
  gapX = 0,
): number {
  if (!containerWidth || containerWidth <= 0) return fallbackItemWidth
  if (!columnCount || columnCount <= 0) return fallbackItemWidth

  const gx = typeof gapX === 'number' && gapX > 0 ? gapX : 0
  const totalGaps = Math.max(0, columnCount - 1) * gx
  const usableWidth = containerWidth - totalGaps

  if (!usableWidth || usableWidth <= 0) return fallbackItemWidth
  return usableWidth / columnCount
}

export function estimateItemHeight(
  item: { width?: number; height?: number } | null | undefined,
  columnWidth: number,
): number {
  const w = item?.width
  const h = item?.height
  if (typeof w === 'number' && typeof h === 'number' && w > 0 && h > 0) {
    return (h / w) * columnWidth
  }
  return columnWidth
}

export function distributeItemsIntoColumns<T extends { width?: number; height?: number }>(
  items: T[],
  { columnCount, columnWidth }: { columnCount: number; columnWidth: number },
): T[][] {
  const columns = Array.from({ length: columnCount }, () => ({ height: 0, items: [] }))

  for (const item of items) {
    let bestIndex = 0
    for (let i = 1; i < columns.length; i += 1) {
      if (columns[i].height < columns[bestIndex].height) bestIndex = i
    }

    ;(columns[bestIndex].items as T[]).push(item)
    columns[bestIndex].height += estimateItemHeight(item, columnWidth)
  }

  return columns.map((c) => c.items as T[])
}
