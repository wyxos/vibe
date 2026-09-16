import { describe, expect, it } from 'vitest'

import {
  calculateFullyVisibleMasonryIndices,
  calculateMasonryEntryOffset,
  calculateMasonryLayout,
  calculateVisibleMasonryIndices,
  continueMasonryLayout,
  projectMasonryLayout,
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

  it('excludes items that only touch a viewport boundary', () => {
    expect(calculateVisibleMasonryIndices([
      { x: 0, y: 0, width: 100, height: 100 },
      { x: 0, y: 100, width: 100, height: 100 },
      { x: 0, y: 200, width: 100, height: 100 },
    ], {
      scrollTop: 100,
      viewportHeight: 100,
      overscan: 0,
    })).toEqual([1])
  })

  it('requires the full height of cards that fit inside the viewport', () => {
    const positions = [
      { x: 0, y: 100, width: 100, height: 200 },
      { x: 0, y: 250, width: 100, height: 200 },
    ]

    expect(calculateFullyVisibleMasonryIndices(
      positions,
      [0, 1],
      { scrollTop: 100, viewportHeight: 300 },
    )).toEqual([0])
  })

  it('requires 80 percent of attainable height for cards taller than the viewport', () => {
    const positions = [
      { x: 0, y: -100, width: 100, height: 1_000 },
    ]

    expect(calculateFullyVisibleMasonryIndices(
      positions,
      [0],
      { scrollTop: -200, viewportHeight: 500 },
    )).toEqual([0])
    expect(calculateFullyVisibleMasonryIndices(
      positions,
      [0],
      { scrollTop: -201, viewportHeight: 500 },
    )).toEqual([])
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

  it('uses a configured minimum column width across desktop widths', () => {
    const mediaItems = Array.from({ length: 12 }, () => media(100, 100))

    expect(calculateMasonryLayout(
      mediaItems,
      1_920,
      { gap: 10, minColumnWidth: 240 },
    ).columns).toBe(7)
    expect(calculateMasonryLayout(
      mediaItems,
      1_920,
      { gap: 10, minColumnWidth: 400 },
    ).columns).toBe(4)
    expect(calculateMasonryLayout(
      mediaItems,
      5_120,
      { gap: 10, minColumnWidth: 400 },
    ).columns).toBe(12)
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

  it.each([
    { height: 640, label: 'landscape', width: 960 },
    { height: 960, label: 'portrait', width: 640 },
    { height: 800, label: 'square', width: 800 },
  ])('uses supplied local dimensions for $label media', ({ height, width }) => {
    const layout = calculateMasonryLayout(
      [{
        height,
        preview: { height: null, width: null },
        width,
      }],
      320,
      { gap: 8, minColumnWidth: 240 },
    )

    expect(layout.items[0]?.height).toBe(320 * (height / width))
  })

  it('prefers authoritative preview dimensions when supplied', () => {
    const layout = calculateMasonryLayout(
      [{
        height: 1_200,
        preview: { height: 450, width: 900 },
        width: 600,
      }],
      320,
      { gap: 8, minColumnWidth: 240 },
    )

    expect(layout.items[0]?.height).toBe(160)
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

  it('continues packing from a prefix after an item is removed', () => {
    const mediaItems = Array.from({ length: 12 }, (_, index) => media(
      100,
      80 + ((index % 5) * 40),
    ))
    const options = { gap: 10, minColumnWidth: 200 }
    const full = calculateMasonryLayout(mediaItems, 500, options)

    ;[0, 1, 5, 11].forEach((removed) => {
      const remaining = mediaItems.filter((_, index) => index !== removed)
      const previous = calculateMasonryLayout(mediaItems, 500, options)
      expect(continueMasonryLayout(
        remaining,
        500,
        options,
        previous,
        removed,
      )).toEqual(calculateMasonryLayout(remaining, 500, options))
    })

    expect(continueMasonryLayout(mediaItems, 500, options, full, 0))
      .toEqual(full)
  })

  it('stops a tail pack at the visible bottom and finishes in later chunks', () => {
    const mediaItems = Array.from({ length: 9_000 }, (_, index) => media(
      800,
      800 + ((index % 5) * 120),
    ))
    const options = { gap: 10, minColumnWidth: 320 }
    const previous = calculateMasonryLayout(mediaItems, 1_440, options)
    const remaining = mediaItems.filter((_, index) => index !== 24)
    const full = calculateMasonryLayout(remaining, 1_440, options)
    const visible = continueMasonryLayout(
      remaining,
      1_440,
      options,
      previous,
      24,
      { untilBottom: 5_400 },
    )

    expect(visible.items.length).toBeLessThan(remaining.length)
    expect(visible.items).toEqual(full.items.slice(0, visible.items.length))

    const finished = continueMasonryLayout(
      remaining,
      1_440,
      options,
      visible,
      visible.items.length,
    )
    expect(finished).toEqual(full)
  })

  it('projects a visible-window removal without packing the whole tail', () => {
    const mediaItems = Array.from({ length: 9_000 }, (_, index) => media(
      800,
      800 + ((index % 5) * 120),
    ))
    const options = { gap: 10, minColumnWidth: 320 }
    const previous = calculateMasonryLayout(mediaItems, 1_440, options)
    const skip = (index: number) => index === 24
    const projected = projectMasonryLayout(
      mediaItems,
      1_440,
      options,
      previous,
      skip,
      5_400,
    )
    const full = projectMasonryLayout(mediaItems, 1_440, options, previous, skip)

    expect(projected.retainedIndices.length).toBeLessThan(full.retainedIndices.length)
    expect(projected.items.slice(0, 24)).toEqual(previous.items.slice(0, 24))
    expect(
      projected.retainedIndices.map((index) => projected.items[index]),
    ).toEqual(
      full.retainedIndices
        .slice(0, projected.retainedIndices.length)
        .map((index) => full.items[index]),
    )
  })

  it('projects a removal without packing items above the first leaving card', () => {
    const mediaItems = Array.from({ length: 10 }, (_, index) => media(
      100,
      90 + ((index % 4) * 30),
    ))
    const options = { gap: 8, minColumnWidth: 180 }
    const settled = calculateMasonryLayout(mediaItems, 600, options)
    const skip = (index: number) => index === 3 || index === 6
    const projected = projectMasonryLayout(mediaItems, 600, options, settled, skip)
    const retained = mediaItems.filter((_, index) => !skip(index))
    const packed = calculateMasonryLayout(retained, 600, options)

    expect(projected.fromIndex).toBe(3)
    expect(projected.items.slice(0, 3)).toEqual(settled.items.slice(0, 3))
    expect(projected.items[3]).toEqual(settled.items[3])
    expect(projected.retainedIndices).toEqual([0, 1, 2, 4, 5, 7, 8, 9])
    expect(projected.retainedIndices.map((index) => projected.items[index]))
      .toEqual(packed.items)
    expect(projected.height).toBe(packed.height)
  })

  it('matches a full 9,000-item relayout after removing an early card', () => {
    const mediaItems = Array.from({ length: 9_000 }, (_, index) => media(
      800,
      800 + ((index % 5) * 120),
    ))
    const options = { gap: 10, minColumnWidth: 320 }
    const previous = calculateMasonryLayout(mediaItems, 1_440, options)
    const remaining = mediaItems.filter((_, index) => index !== 24)
    expect(continueMasonryLayout(
      remaining,
      1_440,
      options,
      previous,
      24,
    )).toEqual(calculateMasonryLayout(remaining, 1_440, options))
  })
})
