import { describe, expect, it } from 'vitest'

import { normalizeReelAudioState } from '@/core/reelAudio'

describe('reel audio state', () => {
  it('normalizes persisted volume, mute, and last-audible values', () => {
    expect(normalizeReelAudioState({
      lastAudibleVolume: 0.4,
      muted: true,
      volume: 2,
    })).toEqual({
      lastAudibleVolume: 0.4,
      muted: true,
      volume: 1,
    })
    expect(normalizeReelAudioState({
      lastAudibleVolume: 0,
      muted: false,
      volume: 0,
    })).toEqual({
      lastAudibleVolume: 1,
      muted: false,
      volume: 0,
    })
  })
})
