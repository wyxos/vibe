import { onBeforeUnmount, ref } from 'vue'

export function useMasonryBoundaryLock() {
  const isBoundaryInteractionLocked = ref(false)
  let releaseTimer: ReturnType<typeof setTimeout> | null = null

  onBeforeUnmount(() => {
    clearBoundaryInteractionReleaseTimer()
  })

  function lockBoundaryInteraction(durationMs: number) {
    clearBoundaryInteractionReleaseTimer()
    isBoundaryInteractionLocked.value = true

    releaseTimer = setTimeout(() => {
      releaseTimer = null
      isBoundaryInteractionLocked.value = false
    }, Math.max(0, durationMs))
  }

  function clearBoundaryInteractionReleaseTimer() {
    if (!releaseTimer) {
      return
    }

    clearTimeout(releaseTimer)
    releaseTimer = null
    isBoundaryInteractionLocked.value = false
  }

  return {
    clearBoundaryInteractionReleaseTimer,
    isBoundaryInteractionLocked,
    lockBoundaryInteraction,
  }
}
