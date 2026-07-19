import { afterEach, describe, expect, it } from 'vitest'

import {
  createReelAutoAdvanceState,
  updateReelAutoAdvanceState,
  validateReelAutoAdvanceOptions,
} from '@/core/reelAutoAdvance'
import { createVibe, type VibeInstance, type VibeItem } from '@/index'

function item(postId: number): VibeItem {
  return {
    postId,
    src: `https://example.com/${postId}.jpg`,
    preview: {
      src: `https://example.com/${postId}-preview.jpg`,
      width: 450,
      height: 600,
    },
    width: 900,
    height: 1200,
    items: [],
  }
}

describe('reel auto advance', () => {
  let instance: VibeInstance | null = null

  afterEach(() => {
    instance?.destroy()
    instance = null
  })

  it('defaults to disabled and excludes grouped post items', () => {
    expect(createReelAutoAdvanceState()).toEqual({
      enabled: false,
      includePostItems: false,
      intervalMs: 5_000,
    })
  })

  it('validates and applies partial runtime updates', () => {
    expect(() => validateReelAutoAdvanceOptions({ intervalMs: 0 })).toThrow(
      'Vibe reelAutoAdvance.intervalMs must be a positive number.',
    )
    const state = createReelAutoAdvanceState()

    updateReelAutoAdvanceState(state, true)
    updateReelAutoAdvanceState(state, {
      includePostItems: true,
      intervalMs: 8_000,
    })

    expect(state).toEqual({
      enabled: true,
      includePostItems: true,
      intervalMs: 8_000,
    })
  })

  it('exposes initial configuration and runtime toggling on the instance', async () => {
    instance = createVibe({
      target: document.createElement('div'),
      layout: 'reel',
      initialPage: { items: [item(1)], next: null },
      reelAutoAdvance: { enabled: true, intervalMs: 2_500 },
    })
    await instance.mount()

    expect(instance.getState().reelAutoAdvance).toEqual({
      enabled: true,
      includePostItems: false,
      intervalMs: 2_500,
    })

    instance.setReelAutoAdvance(false)
    instance.setReelAutoAdvance({ includePostItems: true })

    expect(instance.getState().reelAutoAdvance).toEqual({
      enabled: false,
      includePostItems: true,
      intervalMs: 2_500,
    })
  })
})
