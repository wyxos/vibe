import type { VibeFeedFooterActions } from '../types'

interface FeedFooterActionTarget {
  cancelAutofill: () => Promise<void>
  getState: () => import('../types').VibeState
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
    retry: () => {
      const state = target.getState()
      const resumesPartialAutofill = state.autofill.strategy === 'frontend'
        && state.autofill.status === 'error'
        && state.items.length > 0
        && state.next !== null
      return resumesPartialAutofill ? target.loadNext() : target.reload()
    },
    retryEnd: () => target.retryEnd(),
  }
}
