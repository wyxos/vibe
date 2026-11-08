import type { CreateVibeOptions } from '../types'

/** Consumer-supplied presentation and lifecycle hooks shared by every surface. */
export function surfaceOptions(options: CreateVibeOptions) {
  return {
    canRetryEnd: Boolean(options.loadPage),
    cardFooter: options.cardFooter,
    cardHeader: options.cardHeader,
    feedFooter: options.feedFooter,
    mediaCard: options.mediaCard,
    masonry: options.masonry,
    onMediaFullyVisible: options.onMediaFullyVisible,
    onMediaError: options.onMediaError,
    onMediaReady: options.onMediaReady,
    onMediaVisible: options.onMediaVisible,
    onReelMediaChange: options.onReelMediaChange,
    reelInfoSheet: options.reelInfoSheet,
  }
}
