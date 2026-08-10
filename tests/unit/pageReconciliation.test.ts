import { describe, expect, it } from 'vitest'

import { reconcilePageItems } from '@/core/page'
import type { VibeItem, VibeMediaAsset } from '@/types'

function media(mediaId: number): VibeMediaAsset {
  return { mediaId, src: `${mediaId}.jpg`, preview: { height: 1, src: `${mediaId}-p.jpg`, width: 1 }, height: 1, width: 1 }
}

function item(postId: number, mediaIds: number[]): VibeItem {
  const [primary = postId, ...additional] = mediaIds
  return { ...media(primary), postId, items: additional.map(media) }
}

describe('page reconciliation', () => {
  it('appends posts and missing media without replacing existing identities', () => {
    const existing = item(1, [10, 11])
    const result = reconcilePageItems([existing], [item(1, [10, 11, 12]), item(2, [20])])

    expect(result.map(({ postId }) => postId)).toEqual([1, 2])
    expect(result[0]?.items.map(({ mediaId }) => mediaId)).toEqual([11, 12])
    expect(result[1]?.mediaId).toBe(20)
  })
})
