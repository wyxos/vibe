import { describe, expect, it } from 'vitest'

import {
  calculateMasonryLayout,
  calculateVisibleMasonryIndices,
  type MasonryMediaDimensions,
} from '@/core/masonry'
import {
  createMasonryViewportIndex,
  queryMasonryViewportIndex,
} from '@/core/masonryViewportIndex'

function media(width: number, height: number): MasonryMediaDimensions {
  return {
    width,
    height,
    preview: { width, height },
  }
}

function seededRandom(seed: number): () => number {
  let value = seed >>> 0
  return () => {
    value = (value * 1_664_525 + 1_013_904_223) >>> 0
    return value / 0x1_0000_0000
  }
}

describe('masonry viewport index', () => {
  it('matches the full scan across randomized layouts and windows', () => {
    const random = seededRandom(55_000)

    for (let run = 0; run < 100; run += 1) {
      const itemCount = 20 + Math.floor(random() * 300)
      const layout = calculateMasonryLayout(
        Array.from({ length: itemCount }, () => media(
          200 + Math.floor(random() * 1_000),
          200 + Math.floor(random() * 1_600),
        )),
        320 + Math.floor(random() * 3_000),
        {
          additionalHeight: Math.floor(random() * 100),
          gap: 6 + Math.floor(random() * 8),
          minColumnWidth: 180 + Math.floor(random() * 300),
        },
      )
      const options = {
        overscan: Math.floor(random() * 1_500),
        scrollTop: Math.floor(random() * Math.max(1, layout.height)),
        viewportHeight: 300 + Math.floor(random() * 1_200),
      }

      expect(queryMasonryViewportIndex(
        createMasonryViewportIndex(layout.items),
        options,
      ).indices).toEqual(calculateVisibleMasonryIndices(layout.items, options))
    }
  })

  it('returns original item indexes for projected removal layouts', () => {
    const layout = calculateMasonryLayout(
      Array.from({ length: 4 }, () => media(400, 600)),
      900,
      { gap: 10, minColumnWidth: 400 },
    )
    const sourceIndices = [1, 3, 5, 8]
    const options = { overscan: 0, scrollTop: 0, viewportHeight: 610 }
    const expected = calculateVisibleMasonryIndices(layout.items, options)
      .map((index) => sourceIndices[index]!)

    expect(queryMasonryViewportIndex(
      createMasonryViewportIndex(layout.items, sourceIndices),
      options,
    ).indices).toEqual(expected)
  })

  it('excludes entries that only touch a viewport boundary', () => {
    const positions = [
      { x: 0, y: 0, width: 100, height: 100 },
      { x: 0, y: 100, width: 100, height: 100 },
      { x: 0, y: 200, width: 100, height: 100 },
    ]

    expect(queryMasonryViewportIndex(
      createMasonryViewportIndex(positions),
      { overscan: 0, scrollTop: 100, viewportHeight: 100 },
    ).indices).toEqual([1])
  })

  it('inspects only column boundaries and nearby items in an 8,000-item feed', () => {
    const layout = calculateMasonryLayout(
      Array.from({ length: 8_000 }, () => media(600, 800)),
      3_200,
      { gap: 10, minColumnWidth: 400 },
    )
    const result = queryMasonryViewportIndex(
      createMasonryViewportIndex(layout.items),
      { overscan: 1_000, scrollTop: 250_000, viewportHeight: 1_200 },
    )

    expect(result.indices.length).toBeGreaterThan(0)
    expect(result.inspected).toBeLessThan(250)
    expect(result.indices).toEqual(calculateVisibleMasonryIndices(
      layout.items,
      { overscan: 1_000, scrollTop: 250_000, viewportHeight: 1_200 },
    ))
  })
})
