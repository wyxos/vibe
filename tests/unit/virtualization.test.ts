import { describe, expect, it } from 'vitest'

import { getRenderedItems, getRenderedRange, getVirtualSlideStyle } from '@/components/viewer-core/virtualization'

const createItems = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    id: `item-${index + 1}`,
    type: 'image' as const,
    title: `Item ${index + 1}`,
    url: `https://example.com/item-${index + 1}.jpg`,
    width: 1_920,
    height: 1_080,
    preview: {
      url: `https://example.com/item-${index + 1}-preview.jpg`,
      width: 320,
      height: 180,
    },
  }))

describe('virtualization helpers', () => {
  it('bounds the rendered range at the start, middle, and end of the list', () => {
    expect(getRenderedRange(0, 40)).toEqual({ start: 0, end: 2 })
    expect(getRenderedRange(12, 40)).toEqual({ start: 10, end: 14 })
    expect(getRenderedRange(39, 40)).toEqual({ start: 37, end: 39 })
  })

  it('returns only the visible window items around the active index', () => {
    const items = createItems(40)

    expect(getRenderedItems(items, 12).map(({ index }) => index)).toEqual([10, 11, 12, 13, 14])
  })

  it('computes per-slide transforms from index, viewport height, and drag offset', () => {
    expect(getVirtualSlideStyle(11, 12, 900, -45, true)).toEqual({
      transform: 'translate3d(0, -945px, 0)',
      transition: 'none',
    })
  })
})
