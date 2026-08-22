import { describe, expect, it } from 'vitest'

import {
  inferMediaType,
  isTimedMedia,
  isTimedMediaSource,
  resolveMediaType,
} from '@/core/mediaType'

describe('media type inference', () => {
  it('distinguishes audio, video, and image extensions behind URLs', () => {
    expect(inferMediaType('https://example.com/track.MP3?token=1')).toBe('audio')
    expect(inferMediaType('https://example.com/movie.webm#frame')).toBe('video')
    expect(inferMediaType('https://example.com/cover.webp')).toBe('image')
  })

  it('honors explicit provider types for extensionless sources', () => {
    const source = 'https://example.com/playable?id=42'
    expect(resolveMediaType('audio', source)).toBe('audio')
    expect(isTimedMedia('audio', source)).toBe(true)
    expect(isTimedMedia('image', `${source}.mp3`)).toBe(false)
  })

  it('recognizes inferred audio and video as timed media', () => {
    expect(isTimedMediaSource('/media/track.flac')).toBe(true)
    expect(isTimedMediaSource('/media/movie.mkv')).toBe(true)
    expect(isTimedMediaSource('/media/poster.png')).toBe(false)
  })
})
