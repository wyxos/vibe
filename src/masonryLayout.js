export function getColumnCount(containerWidth, itemWidth) {
  if (!containerWidth || containerWidth <= 0) return 1
  if (!itemWidth || itemWidth <= 0) return 1
  return Math.max(1, Math.floor(containerWidth / itemWidth))
}

export function getColumnWidth(containerWidth, columnCount, fallbackItemWidth) {
  if (!containerWidth || containerWidth <= 0) return fallbackItemWidth
  if (!columnCount || columnCount <= 0) return fallbackItemWidth
  return containerWidth / columnCount
}

export function estimateItemHeight(item, columnWidth) {
  const w = item?.width
  const h = item?.height
  if (typeof w === 'number' && typeof h === 'number' && w > 0 && h > 0) {
    return (h / w) * columnWidth
  }
  return columnWidth
}

export function distributeItemsIntoColumns(items, { columnCount, columnWidth }) {
  const columns = Array.from({ length: columnCount }, () => ({ height: 0, items: [] }))

  for (const item of items) {
    let bestIndex = 0
    for (let i = 1; i < columns.length; i += 1) {
      if (columns[i].height < columns[bestIndex].height) bestIndex = i
    }

    columns[bestIndex].items.push(item)
    columns[bestIndex].height += estimateItemHeight(item, columnWidth)
  }

  return columns.map((c) => c.items)
}
