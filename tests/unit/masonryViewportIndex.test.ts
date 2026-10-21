import { describe, expect, it, vi } from 'vitest'

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
  it('appends 250 cards without reading retained geometry or sorting retained columns', () => {
    const dimensions = Array.from({ length: 9_250 }, (_, index) => media(400, 200 + index % 1_100))
    const options = { gap: 10, minColumnWidth: 320 }
    const layout = calculateMasonryLayout(dimensions, 1_440, options)
    const previous = createMasonryViewportIndex(layout.items.slice(0, 9_000))
    const before = previous.columns.map(column => column.map(entry => ({ ...entry })))
    let positionReads = 0
    let entryReads = 0
    const guarded = new Proxy(layout.items, {
      get(target, key, receiver) {
        if (typeof key === 'string' && /^\d+$/.test(key) && Number(key) < 9_000) positionReads++
        return Reflect.get(target, key, receiver)
      },
    })
    const restore: Array<() => void> = []
    for (const column of previous.columns) for (const entry of column) {
      for (const key of ['index', 'top', 'bottom'] as const) {
        const value = entry[key]
        Object.defineProperty(entry, key, { configurable: true, enumerable: true,
          get() { entryReads++; return value } })
        restore.push(() => Object.defineProperty(entry, key, { configurable: true, enumerable: true, writable: true, value }))
      }
    }
    const sort = vi.spyOn(Array.prototype, 'sort')
    let continued: ReturnType<typeof continueMasonryViewportIndex>
    let sorts: number
    try {
      continued = continueMasonryViewportIndex(guarded, previous, 9_000)
      sorts = sort.mock.calls.length
    } finally {
      sort.mockRestore()
      restore.forEach(reset => reset())
    }
    expect(positionReads).toBe(0)
    expect(entryReads).toBe(0)
    expect(sorts!).toBe(0)
    expect(previous.columns).toEqual(before)
    expect(continued!).toEqual(createMasonryViewportIndex(layout.items))
    const viewport = { overscan: 600, scrollTop: layout.height - 1_500, viewportHeight: 900 }
    expect(queryMasonryViewportIndex(continued!, viewport).indices)
      .toEqual(calculateVisibleMasonryIndices(layout.items, viewport))
  })

  it('retains untouched columns and keeps older snapshots immutable across repeated appends', () => {
    const positions = [
      { x: 0, y: 0, width: 100, height: 80 },
      { x: 110, y: 0, width: 100, height: 500 },
      { x: 0, y: 90, width: 100, height: 700 },
      { x: 110, y: 510, width: 100, height: 80 },
    ]
    const first = createMasonryViewportIndex(positions.slice(0, 2))
    const second = continueMasonryViewportIndex(positions.slice(0, 3), first, 2)
    const third = continueMasonryViewportIndex(positions, second, 3)
    expect(second.columns[1]).toBe(first.columns[1])
    expect(third.columns[0]).toBe(second.columns[0])
    expect(first).toEqual(createMasonryViewportIndex(positions.slice(0, 2)))
    expect(second).toEqual(createMasonryViewportIndex(positions.slice(0, 3)))
    expect(third).toEqual(createMasonryViewportIndex(positions))
    expect(continueMasonryViewportIndex(positions, third, positions.length)).toBe(third)
    for (const scrollTop of [0, 80, 100, 490, 590, 790]) {
      const viewport = { overscan: 0, scrollTop, viewportHeight: 100 }
      expect(queryMasonryViewportIndex(third, viewport).indices)
        .toEqual(calculateVisibleMasonryIndices(positions, viewport))
    }
  })

  it('falls back for a tail inserted before retained geometry and for newly introduced columns', () => {
    const prefix = [
      { x: 0, y: 100, width: 100, height: 100 },
      { x: 110, y: 100, width: 100, height: 200 },
    ]
    const previous = createMasonryViewportIndex(prefix)
    for (const tail of [
      { x: 0, y: 0, width: 100, height: 50 },
      { x: 220, y: 0, width: 100, height: 50 },
      { x: 0, y: 150, width: 100, height: 100 },
    ]) {
      const positions = [...prefix, tail]
      const continued = continueMasonryViewportIndex(positions, previous, prefix.length)
      expect(continued).toEqual(createMasonryViewportIndex(positions))
      for (const scrollTop of [0, 100, 160, 210, 290]) {
        const viewport = { overscan: 0, scrollTop, viewportHeight: 40 }
        expect(queryMasonryViewportIndex(continued, viewport).indices)
          .toEqual(calculateVisibleMasonryIndices(positions, viewport))
      }
    }
  })

  it('preserves custom source indexes and rebuilds changed widths and middle replacements', () => {
    const dimensions = Array.from({ length: 30 }, (_, index) => media(400, 200 + index * 40))
    const options = { gap: 10, minColumnWidth: 320 }
    const initial = calculateMasonryLayout(dimensions, 1_440, options)
    const previous = createMasonryViewportIndex(initial.items.slice(0, 20))
    const sourceIndices = dimensions.map((_, index) => index < 20 ? index : index * 2 + 1)
    const customPrevious = createMasonryViewportIndex(initial.items.slice(0, 20), sourceIndices.slice(0, 20))
    const custom = continueMasonryViewportIndex(initial.items, customPrevious, 20, sourceIndices)
    expect(custom).toEqual(createMasonryViewportIndex(initial.items, sourceIndices))
    const resized = calculateMasonryLayout(dimensions, 900, options)
    expect(continueMasonryViewportIndex(resized.items, previous, 0))
      .toEqual(createMasonryViewportIndex(resized.items))
    const replacement = dimensions.slice()
    replacement[5] = media(400, 1_800)
    const changed = calculateMasonryLayout(replacement, 1_440, options)
    expect(continueMasonryViewportIndex(changed.items, previous, 5))
      .toEqual(createMasonryViewportIndex(changed.items))
  })

})
