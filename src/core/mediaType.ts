import type { VibeMediaType } from '../types'

const AUDIO_MEDIA_PATTERN = /\.(aac|flac|m4a|mp3|oga|ogg|opus|wav)$/i
const VIDEO_MEDIA_PATTERN = /\.(m4v|mkv|mov|mp4|ogv|webm)$/i

function sourcePath(src: string): string {
  try {
    return new URL(src).pathname
  } catch {
    return src.split(/[?#]/)[0] ?? src
  }
}

export function inferMediaType(src: string): VibeMediaType {
  const path = sourcePath(src)
  if (AUDIO_MEDIA_PATTERN.test(path)) return 'audio'
  if (VIDEO_MEDIA_PATTERN.test(path)) return 'video'
  return 'image'
}

export function resolveMediaType(
  type: VibeMediaType | undefined,
  src: string,
): VibeMediaType {
  return type ?? inferMediaType(src)
}

export function isTimedMediaSource(src: string): boolean {
  return inferMediaType(src) !== 'image'
}

export function isTimedMedia(type: VibeMediaType | undefined, src: string): boolean {
  return resolveMediaType(type, src) !== 'image'
}
