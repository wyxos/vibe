import { describe, expect, it } from 'vitest'

import {
  createSyntheticMasonryItems,
  releaseSyntheticMasonryMedia,
  SYNTHETIC_JPEG_WIDTH,
} from '@/pages/syntheticMasonryMedia'

describe('synthetic masonry media', () => {
  it('keeps unique JPEG blob URLs distinct from a shared raster', async () => {
    const unique = await createSyntheticMasonryItems(3, 'unique')
    expect(new Set(unique.map((item) => item.src)).size).toBe(3)
    expect(unique[0]?.preview?.width).toBe(SYNTHETIC_JPEG_WIDTH)
    expect(unique[0]?.preview?.src).toBe(unique[0]?.src)

    const shared = await createSyntheticMasonryItems(3, 'shared')
    expect(new Set(shared.map((item) => item.src)).size).toBe(1)
    expect(shared[0]?.src).not.toBe(unique[0]?.src)
    releaseSyntheticMasonryMedia()
  })
})
