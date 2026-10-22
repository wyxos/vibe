type PlaybackAction = 'load-requested' | 'play-requested' | 'play-resolved' | 'play-rejected'
type PlaybackReason = 'none' | 'aborted' | 'not-allowed' | 'unsupported' | 'other'

function rejectionReason(error: unknown): PlaybackReason {
  try {
    if (typeof error !== 'object' || error === null || !('name' in error)) return 'other'
    switch (error.name) {
      case 'AbortError': return 'aborted'
      case 'NotAllowedError': return 'not-allowed'
      case 'NotSupportedError': return 'unsupported'
      default: return 'other'
    }
  } catch { return 'other' }
}

/** Numeric/media evidence belongs to the consumer; this event exposes fixed lifecycle categories only. */
export function emitMediaPlaybackDiagnostic(media: HTMLMediaElement, action: PlaybackAction, error?: unknown): void {
  if (!import.meta.env.DEV) return
  try {
    media.dispatchEvent(new CustomEvent('vibe:playback-diagnostic', {
      bubbles: true,
      detail: { action, reason: action === 'play-rejected' ? rejectionReason(error) : 'none' },
    }))
  } catch { /* Optional diagnosis must not change playback control or promise handling. */ }
}
