import type { VibeViewerType } from '../viewer'

const NEUTRAL_STAGE_TONE = 'bg-[linear-gradient(180deg,#0a0b10,#05060a)]'
const NEUTRAL_SLIDE_TONE = 'bg-[linear-gradient(180deg,#0b0c11,#06070b)]'

const _toneByTypeGuard: Record<VibeViewerType, true> = {
  image: true,
  video: true,
  audio: true,
  other: true,
}

export function getStageToneClass(type: VibeViewerType) {
  void _toneByTypeGuard[type]
  return NEUTRAL_STAGE_TONE
}

export function getSlideToneClass(type: VibeViewerType) {
  void _toneByTypeGuard[type]
  return NEUTRAL_SLIDE_TONE
}
