import { describe, expect, it } from 'vitest'

import { getTrailingBoundaryLoadProgress } from '@/components/viewer-core/masonryScrollBehavior'

describe('masonryScrollBehavior', () => {
  it('keeps trailing progress below complete until the full buffered scroll budget is reached', () => {
    const progress = getTrailingBoundaryLoadProgress({
      active: true,
      maxScrollTop: 1_500,
      progressDistancePx: 1_499,
      thresholdPx: 0,
      triggerEnabled: true,
    })

    expect(progress).toBeGreaterThan(0.95)
    expect(progress).toBeLessThan(1)
    expect(getTrailingBoundaryLoadProgress({
      active: true,
      maxScrollTop: 1_500,
      progressDistancePx: 1_500,
      thresholdPx: 0,
      triggerEnabled: true,
    })).toBe(1)
  })
})
