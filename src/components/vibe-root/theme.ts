import type { VibeViewerType } from '../vibeViewer'

const STAGE_TONE_BY_TYPE: Record<VibeViewerType, string> = {
  image: 'bg-[radial-gradient(circle_at_top_center,rgba(251,191,36,0.4)_0,transparent_42%),linear-gradient(180deg,#120d08,#050507)]',
  video: 'bg-[radial-gradient(circle_at_top_center,rgba(56,189,248,0.38)_0,transparent_42%),linear-gradient(180deg,#07111c,#050608)]',
  audio: 'bg-[radial-gradient(circle_at_top_center,rgba(16,185,129,0.32)_0,transparent_42%),linear-gradient(180deg,#06120f,#040506)]',
  document: 'bg-[radial-gradient(circle_at_top_center,rgba(168,85,247,0.34)_0,transparent_42%),linear-gradient(180deg,#120817,#050507)]',
  archive: 'bg-[radial-gradient(circle_at_top_center,rgba(251,113,133,0.32)_0,transparent_42%),linear-gradient(180deg,#160809,#050507)]',
  other: 'bg-[radial-gradient(circle_at_top_center,rgba(148,163,184,0.28)_0,transparent_42%),linear-gradient(180deg,#0d0c10,#040506)]',
}

const SLIDE_TONE_BY_TYPE: Record<VibeViewerType, string> = {
  image: 'bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.4)_0,transparent_42%),linear-gradient(180deg,#120d08,#050507)]',
  video: 'bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.38)_0,transparent_42%),linear-gradient(180deg,#07111c,#050608)]',
  audio: 'bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.32)_0,transparent_42%),linear-gradient(180deg,#06120f,#040506)]',
  document: 'bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.34)_0,transparent_42%),linear-gradient(180deg,#120817,#050507)]',
  archive: 'bg-[radial-gradient(circle_at_center,rgba(251,113,133,0.32)_0,transparent_42%),linear-gradient(180deg,#160809,#050507)]',
  other: 'bg-[radial-gradient(circle_at_center,rgba(148,163,184,0.28)_0,transparent_42%),linear-gradient(180deg,#0d0c10,#040506)]',
}

export function getStageToneClass(type: VibeViewerType) {
  return STAGE_TONE_BY_TYPE[type]
}

export function getSlideToneClass(type: VibeViewerType) {
  return SLIDE_TONE_BY_TYPE[type]
}
