import { describe, expect, it } from 'vitest'

import { getVibeMasonryEnterOrder, getVibeMasonryEnterStartY } from '@/components/viewer-core/useMasonryMotion'

describe('useMasonryMotion', () => {
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

  it('reverses prepend stagger order and keeps append order unchanged', () => {
    expect(getVibeMasonryEnterOrder(['0', '1', '2', '3'], 'bottom')).toEqual(['0', '1', '2', '3'])
    expect(getVibeMasonryEnterOrder(['0', '1', '2', '3'], 'top')).toEqual(['3', '2', '1', '0'])
  })
})
