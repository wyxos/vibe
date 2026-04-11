import { describe, expect, it } from 'vitest'

import {
  getVibeMasonryViewportHeight,
  getVibeMasonryViewportWidth,
} from '@/components/viewer-core/masonryViewport'

describe('masonryViewport helpers', () => {
  it('prefers the last measured fallback width over the full window width when a hidden viewport reports zero width', () => {
    const viewport = {
      clientWidth: 0,
      getBoundingClientRect: () => ({ width: 0 }),
    } as unknown as HTMLElement

    expect(getVibeMasonryViewportWidth(viewport, 1284, 300)).toBe(1284)
  })

  it('prefers the last measured fallback height over the full window height when a hidden viewport reports zero height', () => {
    const viewport = {
      clientHeight: 0,
      getBoundingClientRect: () => ({ height: 0 }),
    } as unknown as HTMLElement

    expect(getVibeMasonryViewportHeight(viewport, 981)).toBe(981)
  })
})
