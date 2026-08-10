import type { VibeMediaType } from '../types'

const TIMED_MEDIA_PATTERN = /\.(aac|flac|m4a|mp3|mp4|mov|ogg|opus|wav|webm)$/i

export function isTimedMediaSource(src: string): boolean {
  try {
    return TIMED_MEDIA_PATTERN.test(new URL(src).pathname)
  } catch {
    return TIMED_MEDIA_PATTERN.test(src.split('?')[0] ?? src)
  }
}

export function isTimedMedia(type: VibeMediaType | undefined, src: string): boolean {
  return type === undefined ? isTimedMediaSource(src) : type === 'video'
}
