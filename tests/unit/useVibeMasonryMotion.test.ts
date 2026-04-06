import { describe, expect, it } from 'vitest'

import { getVibeMasonryEnterStartY } from '@/components/vibe-root/useVibeMasonryMotion'

describe('useVibeMasonryMotion', () => {
  it('starts prepended items above the viewport and appended items below it', () => {
    expect(getVibeMasonryEnterStartY({
      columnWidth: 300,
      direction: 'top',
      itemHeight: 240,
      scrollTop: 1_000,
      viewportHeight: 800,
    })).toBe(760)

    expect(getVibeMasonryEnterStartY({
      columnWidth: 300,
      direction: 'bottom',
      itemHeight: 240,
      scrollTop: 1_000,
      viewportHeight: 800,
    })).toBe(2_040)
  })
})
