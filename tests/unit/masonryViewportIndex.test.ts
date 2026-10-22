import { describe, expect, it } from 'vitest'

import {
  calculateMasonryLayout,
  calculateVisibleMasonryIndices,
  projectMasonryLayout,
  type MasonryMediaDimensions,
} from '@/core/masonry'
import {
  continueMasonryViewportIndex,
  createMasonryViewportIndex,
  projectMasonryViewportIndex,
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

  it('continues a 9,000-item index from the first changed card', () => {
    const mediaItems = Array.from({ length: 9_000 }, () => media(600, 800))
    const options = { gap: 10, minColumnWidth: 320 }
    const previousLayout = calculateMasonryLayout(mediaItems, 1_440, options)
    const remaining = mediaItems.filter((_, index) => index !== 24)
    const layout = calculateMasonryLayout(remaining, 1_440, options)
    const previous = createMasonryViewportIndex(previousLayout.items)
    const continued = continueMasonryViewportIndex(layout.items, previous, 24)
    const viewport = { overscan: 800, scrollTop: 4_500, viewportHeight: 900 }

    expect(continued).toEqual(createMasonryViewportIndex(layout.items))
    expect(queryMasonryViewportIndex(continued, viewport).indices)
      .toEqual(calculateVisibleMasonryIndices(layout.items, viewport))
  })

  it('projects a removal index without rebuilding cards above the leaving item', () => {
    const mediaItems = Array.from({ length: 40 }, (_, index) => media(
      400,
      500 + ((index % 3) * 80),
    ))
    const options = { gap: 10, minColumnWidth: 320 }
    const settled = calculateMasonryLayout(mediaItems, 1_000, options)
    const skip = (index: number) => index === 6
    const projected = projectMasonryLayout(mediaItems, 1_000, options, settled, skip)
    const previous = createMasonryViewportIndex(settled.items)

    expect(projectMasonryViewportIndex(
      projected.items,
      projected.retainedIndices,
      previous,
      projected.fromIndex,
    )).toEqual(createMasonryViewportIndex(
      projected.retainedIndices.map((index) => projected.items[index]!),
      projected.retainedIndices,
    ))
  })
})
