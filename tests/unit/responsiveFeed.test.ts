import { describe, expect, it } from 'vitest'

import {
  TABLET_SHORT_EDGE,
  shouldForceSingleColumnFeed,
} from '@/demo/responsiveFeed'

describe('responsive feed mode', () => {
  it.each([
    { screenHeight: 844, screenWidth: 390 },
    { screenHeight: 390, screenWidth: 844 },
    { screenHeight: 915, screenWidth: 412 },
    { screenHeight: 412, screenWidth: 915 },
    { screenHeight: 932, screenWidth: 430 },
    { screenHeight: 430, screenWidth: 932 },
  ])('uses one column on phones in either orientation', (screen) => {
    expect(shouldForceSingleColumnFeed({
      hasHover: true,
      ...screen,
      viewportHeight: screen.screenHeight,
      viewportWidth: screen.screenWidth,
    })).toBe(true)
  })

  it.each([
    { screenHeight: 1024, screenWidth: TABLET_SHORT_EDGE },
    { screenHeight: TABLET_SHORT_EDGE, screenWidth: 1024 },
    { screenHeight: 1180, screenWidth: 820 },
    { screenHeight: 820, screenWidth: 1180 },
  ])('keeps tablets in masonry mode in either orientation', (screen) => {
    expect(shouldForceSingleColumnFeed({
      hasHover: false,
      ...screen,
      viewportHeight: screen.screenHeight,
      viewportWidth: screen.screenWidth,
    })).toBe(false)
  })

  it('keeps desktop-sized screens in masonry mode', () => {
    expect(shouldForceSingleColumnFeed({
      hasHover: true,
      screenHeight: 768,
      screenWidth: 1024,
      viewportHeight: 430,
      viewportWidth: 932,
    })).toBe(false)
  })

  it('uses one column when device emulation retains an unrelated desktop screen', () => {
    expect(shouldForceSingleColumnFeed({
      hasHover: false,
      screenHeight: 1080,
      screenWidth: 1920,
      viewportHeight: 430,
      viewportWidth: 932,
    })).toBe(true)
  })

  it('does not treat tablet browser chrome as an unrelated screen', () => {
    expect(shouldForceSingleColumnFeed({
      hasHover: false,
      screenHeight: 600,
      screenWidth: 1024,
      viewportHeight: 560,
      viewportWidth: 1024,
    })).toBe(false)
  })
})
