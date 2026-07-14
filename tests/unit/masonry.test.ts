import { describe, expect, it } from 'vitest'

import {
  calculateMasonryEntryOffset,
  calculateMasonryLayout,
  calculateSingleColumnFeedLayout,
  calculateVisibleMasonryIndices,
  findNearestMasonryItemIndex,
  type MasonryMediaDimensions,
} from '@/demo/masonry'

function media(width: number | null, height: number | null): MasonryMediaDimensions {
  return {
    width,
    height,
    preview: { width, height },
  }
}

describe('calculated masonry layout', () => {
  it('returns only items intersecting the viewport and overscan', () => {
    const indices = calculateVisibleMasonryIndices([
      { x: 0, y: 0, width: 100, height: 200 },
      { x: 110, y: 0, width: 100, height: 100 },
      { x: 110, y: 110, width: 100, height: 100 },
      { x: 0, y: 210, width: 100, height: 100 },
      { x: 110, y: 220, width: 100, height: 100 },
    ], {
      scrollTop: 205,
      viewportHeight: 10,
      overscan: 0,
    })

    expect(indices).toEqual([2, 3])
  })

  it('offsets the entering layout below the full container', () => {
    expect(calculateMasonryEntryOffset({
      containerHeight: 700,
      gap: 10,
    })).toBe(710)

    expect(calculateMasonryEntryOffset({
      containerHeight: -1,
      gap: -1,
    })).toBe(0)
  })

  it('finds the item nearest to a reel scroll offset', () => {
    const items = [
      { x: 0, y: 0, width: 100, height: 500 },
      { x: 0, y: 506, width: 100, height: 500 },
      { x: 0, y: 1012, width: 100, height: 500 },
    ]

    expect(findNearestMasonryItemIndex(items, 800)).toBe(2)
    expect(findNearestMasonryItemIndex(items, 510)).toBe(1)
    expect(findNearestMasonryItemIndex([], 510)).toBeNull()
  })

  it('places each item in the current shortest column', () => {
    const layout = calculateMasonryLayout(
      [media(100, 200), media(100, 100), media(100, 100), media(100, 100)],
      500,
      { gap: 10, minColumnWidth: 200 },
    )

    expect(layout.columns).toBe(2)
    expect(layout.items).toEqual([
      { x: 0, y: 0, width: 245, height: 490 },
      { x: 255, y: 0, width: 245, height: 245 },
      { x: 255, y: 255, width: 245, height: 245 },
      { x: 0, y: 500, width: 245, height: 245 },
    ])
    expect(layout.height).toBe(745)
  })

  it('uses one column below the target column width', () => {
    const layout = calculateMasonryLayout(
      [media(100, 100), media(100, 200)],
      230,
      { gap: 6, minColumnWidth: 240 },
    )

    expect(layout.columns).toBe(1)
    expect(layout.items[1]).toEqual({
      x: 0,
      y: 236,
      width: 230,
      height: 460,
    })
    expect(layout.height).toBe(696)
  })

  it('can cap a wide layout at one column', () => {
    const layout = calculateMasonryLayout(
      [media(100, 100), media(100, 200)],
      1180,
      { gap: 8, maxColumns: 1, minColumnWidth: 240 },
    )

    expect(layout.columns).toBe(1)
    expect(layout.items[1]?.x).toBe(0)
    expect(layout.items[1]?.width).toBe(1180)
  })

  it('turns a one-column layout into equal viewport-height feed slides', () => {
    const masonry = calculateMasonryLayout(
      [media(100, 100), media(100, 200), media(200, 100)],
      230,
      { gap: 6, minColumnWidth: 240 },
    )

    const layout = calculateSingleColumnFeedLayout(masonry, {
      gap: 6,
      itemHeight: 500,
    })

    expect(layout.items.map(({ y, height }) => ({ y, height }))).toEqual([
      { y: 0, height: 500 },
      { y: 506, height: 500 },
      { y: 1012, height: 500 },
    ])
    expect(layout.height).toBe(1512)
  })

  it('leaves a multi-column masonry layout unchanged', () => {
    const masonry = calculateMasonryLayout(
      [media(100, 100), media(100, 200)],
      500,
      { gap: 10, minColumnWidth: 200 },
    )

    expect(calculateSingleColumnFeedLayout(masonry, {
      gap: 10,
      itemHeight: 500,
    })).toBe(masonry)
  })

  it('falls back to a square when dimensions are unavailable', () => {
    const layout = calculateMasonryLayout(
      [media(null, null)],
      320,
      { gap: 8, minColumnWidth: 240 },
    )

    expect(layout.items[0]).toEqual({
      x: 0,
      y: 0,
      width: 320,
      height: 320,
    })
  })
})
