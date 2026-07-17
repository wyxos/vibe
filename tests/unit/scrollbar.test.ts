import { describe, expect, it } from 'vitest'

import { calculateScrollbarGeometry } from '@/core/scrollbar'

describe('scrollbar geometry', () => {
  it('hides the thumb when content fits the viewport', () => {
    expect(calculateScrollbarGeometry({
      contentSize: 400,
      minimumThumbSize: 32,
      scrollPosition: 0,
      trackSize: 500,
      viewportSize: 500,
    })).toEqual({
      maximumScrollPosition: 0,
      scrollable: false,
      thumbOffset: 0,
      thumbSize: 500,
      thumbTravel: 0,
    })
  })

  it('maps content ratio and scroll position onto the track', () => {
    expect(calculateScrollbarGeometry({
      contentSize: 2000,
      minimumThumbSize: 32,
      scrollPosition: 750,
      trackSize: 500,
      viewportSize: 500,
    })).toEqual({
      maximumScrollPosition: 1500,
      scrollable: true,
      thumbOffset: 187.5,
      thumbSize: 125,
      thumbTravel: 375,
    })
  })

  it('enforces a usable minimum thumb and clamps overscroll', () => {
    expect(calculateScrollbarGeometry({
      contentSize: 100000,
      minimumThumbSize: 32,
      scrollPosition: 200000,
      trackSize: 500,
      viewportSize: 500,
    })).toMatchObject({
      maximumScrollPosition: 99500,
      scrollable: true,
      thumbOffset: 468,
      thumbSize: 32,
      thumbTravel: 468,
    })
  })
})
