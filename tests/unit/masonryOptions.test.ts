import { describe, expect, it } from 'vitest'

import {
  DEFAULT_MASONRY_MIN_COLUMN_WIDTH,
  resolveMasonryMinColumnWidth,
  resolveMasonryOverscan,
  validateMasonryOptions,
} from '@/core/masonryOptions'
import { createVibe } from '@/index'
import { isNearFeedBottom } from '@/core/feed'

describe('masonry options', () => {
  it.each(['bottomSpacePx', 'loadMoreThresholdPx'] as const)('validates %s through the public API', property => {
    for (const value of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => createVibe({ target: document.createElement('div'), masonry: { [property]: value } }))
        .toThrow(`Vibe masonry ${property} must be a finite non-negative number.`)
    }
    expect(() => validateMasonryOptions({ [property]: 0 })).not.toThrow()
    expect(() => validateMasonryOptions({ [property]: 200 })).not.toThrow()
  })

  it('measures thresholds from the actual padded bottom and preserves the reel default', () => {
    const element = { scrollHeight: 1_200, clientHeight: 500, scrollTop: 599 } as HTMLElement
    expect(isNearFeedBottom(element, 100)).toBe(false)
    element.scrollTop = 600
    expect(isNearFeedBottom(element, 100)).toBe(true)
    expect(isNearFeedBottom(element, 0)).toBe(false)
    element.scrollTop = 700
    expect(isNearFeedBottom(element, 0)).toBe(true)
    element.scrollTop = 460
    expect(isNearFeedBottom(element)).toBe(true)
    element.scrollTop = 459
    expect(isNearFeedBottom(element)).toBe(false)
  })
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
