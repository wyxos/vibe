import { describe, expect, it } from 'vitest'

import {
  DEFAULT_MASONRY_MIN_COLUMN_WIDTH,
  resolveMasonryMinColumnWidth,
  resolveMasonryOverscan,
  validateMasonryOptions,
} from '@/core/masonryOptions'
import { createVibe } from '@/index'

describe('masonry options', () => {
  it('resolves an opt-in minimum column width without changing the default', () => {
    expect(resolveMasonryMinColumnWidth(undefined))
      .toBe(DEFAULT_MASONRY_MIN_COLUMN_WIDTH)
    expect(resolveMasonryMinColumnWidth({ minColumnWidth: 400 })).toBe(400)
  })

  it('preserves the existing uncapped overscan by default', () => {
    expect(resolveMasonryOverscan(undefined, 400)).toBe(800)
    expect(resolveMasonryOverscan(undefined, 1_000)).toBe(1_500)
  })

  it('resolves an opt-in capped viewport window', () => {
    const options = {
      overscan: {
        maximumPx: 1_000,
        minimumPx: 600,
        viewportMultiplier: 0.5,
      },
    }

    expect(resolveMasonryOverscan(options, 720)).toBe(600)
    expect(resolveMasonryOverscan(options, 3_000)).toBe(1_000)
  })

  it('rejects negative and inverted limits', () => {
    expect(() => validateMasonryOptions({ minColumnWidth: 0 })).toThrow(
      'Vibe masonry minColumnWidth must be a positive number.',
    )
    expect(() => validateMasonryOptions({
      overscan: { viewportMultiplier: -1 },
    })).toThrow(
      'Vibe masonry overscan viewportMultiplier must be a non-negative number.',
    )
    expect(() => validateMasonryOptions({
      overscan: { maximumPx: 400, minimumPx: 600 },
    })).toThrow(
      'Vibe masonry overscan maximumPx must be greater than or equal to minimumPx.',
    )
  })

  it('validates the public createVibe option', () => {
    const target = document.createElement('div')

    expect(() => createVibe({
      masonry: { overscan: { maximumPx: -1 } },
      target,
    })).toThrow('Vibe masonry overscan maximumPx must be a non-negative number.')
    expect(() => createVibe({
      masonry: { minColumnWidth: Number.NaN },
      target,
    })).toThrow('Vibe masonry minColumnWidth must be a positive number.')
  })
})
