import { describe, expect, it } from 'vitest'

import { distributeItemsIntoColumns, getColumnCount, getColumnWidth } from '../src/masonryLayout'

describe('masonryLayout', () => {
  it('computes column count from container width and target item width', () => {
    expect(getColumnCount(0, 300)).toBe(1)
    expect(getColumnCount(299, 300)).toBe(1)
    expect(getColumnCount(300, 300)).toBe(1)
    expect(getColumnCount(599, 300)).toBe(1)
    expect(getColumnCount(600, 300)).toBe(2)
    expect(getColumnCount(1456, 300)).toBe(4)
  })

  it('computes column width', () => {
    expect(getColumnWidth(0, 3, 300)).toBe(300)
    expect(getColumnWidth(900, 3, 300)).toBe(300)

    // When gaps are used in x layout, column width must shrink so total
    // (columns + gaps) fits exactly within the container.
    expect(getColumnWidth(1000, 3, 300, 16)).toBeCloseTo((1000 - 32) / 3, 8)
  })

  it('distributes items to the shortest column', () => {
    const items = [
      { id: 'a', width: 300, height: 300 }, // 300
      { id: 'b', width: 300, height: 600 }, // 600
      { id: 'c', width: 300, height: 300 }, // 300
    ]

    const columns = distributeItemsIntoColumns(items, { columnCount: 2, columnWidth: 300 })

    expect(columns).toHaveLength(2)
    expect(columns[0].map((i) => i.id)).toEqual(['a', 'c'])
    expect(columns[1].map((i) => i.id)).toEqual(['b'])
  })

  it('uses aspect ratio to estimate heights', () => {
    const items = [
      { id: 'a', width: 150, height: 300 }, // 600 @ colW=300
      { id: 'b', width: 300, height: 300 }, // 300
      { id: 'c', width: 300, height: 300 }, // 300
    ]

    const columns = distributeItemsIntoColumns(items, { columnCount: 2, columnWidth: 300 })

    // a goes to col0 (600), b to col1 (300), c to col1 (600)
    expect(columns[0].map((i) => i.id)).toEqual(['a'])
    expect(columns[1].map((i) => i.id)).toEqual(['b', 'c'])
  })
})
