import { describe, expect, it } from 'vitest'

import {
  buildMasonryLayout,
  estimateItemHeight,
  getColumnCount,
  getColumnWidth,
  getMasonryDimensions,
  getVisibleIndicesFromBuckets,
} from '@/components/viewer-core/masonryLayout'
import type { VibeViewerItem } from '@/components/viewer'

describe('masonryLayout', () => {
  it('prefers preview dimensions, then original dimensions, then a square fallback', () => {
    expect(getMasonryDimensions(createItem('preview-first', {
      width: 1_920,
      height: 1_080,
      preview: {
        url: 'https://example.com/preview-first-preview.jpg',
        width: 320,
        height: 180,
      },
    }))).toEqual({
      width: 320,
      height: 180,
      source: 'preview',
    })

    expect(getMasonryDimensions(createItem('original-second', {
      width: 2_400,
      height: 1_600,
    }))).toEqual({
      width: 2_400,
      height: 1_600,
      source: 'original',
    })

    expect(getMasonryDimensions(createItem('fallback-third'))).toEqual({
      width: 1,
      height: 1,
      source: 'fallback',
    })

    expect(getMasonryDimensions(createItem('archive-square', {
      type: 'other',
      preview: {
        url: 'https://example.com/archive-square-preview.jpg',
        width: 480,
        height: 720,
      },
      width: 1_600,
      height: 900,
    }))).toEqual({
      width: 1,
      height: 1,
      source: 'fallback',
    })
  })

  it('matches the master-style column sizing', () => {
    expect(getColumnCount(980, 300)).toBe(3)
    expect(getColumnWidth(980, 3, 300, 16)).toBe(316)
    expect(estimateItemHeight(createItem('height-test', {
      preview: {
        url: 'https://example.com/height-test-preview.jpg',
        width: 300,
        height: 450,
      },
    }), 316)).toBe(474)
  })

  it('renders ultra-wide image previews as squares in the masonry grid', () => {
    const dimensions = getMasonryDimensions(createItem('wide-preview', {
      preview: {
        url: 'https://example.com/wide-preview.jpg',
        width: 1_200,
        height: 400,
      },
    }))

    expect(dimensions).toEqual({
      width: 1_200,
      height: 1_200,
      source: 'preview',
    })
    expect(estimateItemHeight(createItem('wide-preview-height', {
      preview: {
        url: 'https://example.com/wide-preview-height.jpg',
        width: 1_200,
        height: 400,
      },
    }), 296)).toBe(296)
  })

  it('distributes items into the shortest column', () => {
    const items = [
      createItem('item-1', {
        preview: {
          url: 'https://example.com/item-1-preview.jpg',
          width: 300,
          height: 300,
        },
      }),
      createItem('item-2', {
        preview: {
          url: 'https://example.com/item-2-preview.jpg',
          width: 300,
          height: 600,
        },
      }),
      createItem('item-3', {
        preview: {
          url: 'https://example.com/item-3-preview.jpg',
          width: 300,
          height: 300,
        },
      }),
      createItem('item-4', {
        preview: {
          url: 'https://example.com/item-4-preview.jpg',
          width: 300,
          height: 300,
        },
      }),
    ]

    const layout = buildMasonryLayout(items, {
      bucketPx: 600,
      columnCount: 2,
      columnWidth: 300,
      gapX: 16,
      gapY: 16,
    })

    expect(layout.positions).toEqual([
      { x: 0, y: 0 },
      { x: 316, y: 0 },
      { x: 0, y: 316 },
      { x: 316, y: 616 },
    ])
    expect(layout.heights).toEqual([300, 600, 300, 300])
    expect(layout.contentHeight).toBe(916)
  })

  it('returns only bucket-visible indices for the current scroll range', () => {
    const visibleIndices = getVisibleIndicesFromBuckets({
      itemCount: 8,
      viewportHeight: 700,
      scrollTop: 650,
      overscanPx: 0,
      bucketPx: 600,
      buckets: new Map<number, number[]>([
        [0, [0, 1]],
        [1, [1, 2, 3]],
        [2, [4, 5]],
        [3, [6, 7]],
      ]),
    })

    expect(visibleIndices).toEqual([1, 2, 3, 4, 5])
  })
})

function createItem(
  id: string,
  overrides: Partial<VibeViewerItem> = {},
): VibeViewerItem {
  return {
    id,
    type: 'image',
    title: id,
    url: `https://example.com/${id}.jpg`,
    ...overrides,
  }
}
