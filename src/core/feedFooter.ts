import type { VibeFeedFooterActions } from '../types'

interface FeedFooterActionTarget {
  cancelAutofill: () => Promise<void>
  loadNext: () => Promise<void>
  reload: () => Promise<void>
  retryEnd: () => Promise<void>
}

export function createFeedFooterActions(
  target: FeedFooterActionTarget,
): VibeFeedFooterActions {
  return {
    cancelAutofill: () => target.cancelAutofill(),
    loadMore: () => target.loadNext(),
    retry: () => target.reload(),
    retryEnd: () => target.retryEnd(),
  }
}
