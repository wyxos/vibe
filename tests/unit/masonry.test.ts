import { describe, expect, it } from 'vitest'

import {
  calculateMasonryEntryOffset,
  calculateMasonryLayout,
  calculateVisibleMasonryIndices,
  type MasonryMediaDimensions,
} from '@/core/masonry'

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

  it('adds deterministic in-flow chrome to each media height', () => {
    const layout = calculateMasonryLayout(
      [media(100, 100), media(100, 200)],
      320,
      { additionalHeight: 88, gap: 8, minColumnWidth: 320 },
    )

    expect(layout.items).toEqual([
      { x: 0, y: 0, width: 320, height: 408 },
      { x: 0, y: 416, width: 320, height: 728 },
    ])
    expect(layout.height).toBe(1144)
  })
})
