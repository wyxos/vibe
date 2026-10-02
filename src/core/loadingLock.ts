import { nextTick } from 'vue'
import type { VibeRuntimeState } from './runtime'

interface LoadingLockActions {
  getPending: () => Promise<void> | null
  hasPendingSession: () => boolean
  loadIfNearBottom: () => Promise<void> | undefined
  loadNext: () => Promise<void>
  resumeFill: () => Promise<void>
}

export function setLoadingLock(state: VibeRuntimeState, locked: boolean, actions: LoadingLockActions): void {
  if (state.loadMoreLocked === locked) return
  state.loadMoreLocked = locked
  if (locked) return
  if (state.fill.status === 'paused' && state.fill.target) {
    void actions.resumeFill()
    return
  }
  if (state.autofill.status === 'paused' || actions.hasPendingSession()) {
    const pending = actions.getPending()
    if (pending) void pending.finally(() => { void actions.loadNext() })
    else void actions.loadNext()
  } else if (state.infiniteScroll) {
    void nextTick(actions.loadIfNearBottom)
  }
}
