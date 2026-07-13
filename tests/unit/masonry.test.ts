import { describe, expect, it } from 'vitest'

import {
  calculateMasonryLayout,
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
})
