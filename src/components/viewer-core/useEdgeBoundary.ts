import { onBeforeUnmount, ref, type Ref } from 'vue'

const EDGE_WHEEL_LOCK_MS = 250
const EDGE_FAILURE_COOLDOWN_MS = 1000

export type VibeMasonryEdgeDirection = 'bottom' | 'top'
export type VibeMasonryBoundarySyncSource = 'layout' | 'scroll'

export function useEdgeBoundary(options: {
  direction: VibeMasonryEdgeDirection
  interactionLocked?: Ref<boolean>
  hasPage: Ref<boolean>
  isAtBoundary: () => boolean
  loading: Ref<boolean>
  requestPage: Ref<(() => void | Promise<void>) | null | undefined>
  getAnimationLockMs: (addedItemCount: number) => number
}) {
  const isBoundaryActive = ref(false)
  const hasSeenOffBoundary = ref(false)
  const intentVersion = ref(0)
  const consumedIntentVersion = ref(0)
  const isCycleLocked = ref(false)
  const isRequestPending = ref(false)
  const hasDeferredBoundaryIntent = ref(false)

  let wheelLockedUntil = 0
  let releaseTimer: ReturnType<typeof setTimeout> | null = null

  onBeforeUnmount(() => {
    clearReleaseTimer()
  })

  function syncBoundary(source: VibeMasonryBoundarySyncSource = 'layout') {
    const wasAtBoundary = isBoundaryActive.value
    isBoundaryActive.value = options.isAtBoundary()

    if (!isBoundaryActive.value) {
      if ((!isCycleLocked.value && !isRequestPending.value) || source === 'scroll') {
        hasSeenOffBoundary.value = true
      }
      return
    }

    if (!wasAtBoundary && hasSeenOffBoundary.value) {
      if (source === 'scroll' && isCycleLocked.value) {
        hasDeferredBoundaryIntent.value = true
        return
      }
      registerIntent()
    }
  }

  function onWheel(event: WheelEvent) {
    if (!matchesWheelDirection(event) || !options.isAtBoundary()) {
      return
    }

    const now = Date.now()
    if (now < wheelLockedUntil) {
      return
    }

    wheelLockedUntil = now + EDGE_WHEEL_LOCK_MS
    if (isCycleLocked.value) {
      hasDeferredBoundaryIntent.value = true
      return
    }
    registerIntent()
  }

  function maybeRequestPage() {
    if (!canRequestPage()) {
      return
    }

    const requestPage = options.requestPage.value
    if (typeof requestPage !== 'function') {
      return
    }

    consumedIntentVersion.value = intentVersion.value
    hasSeenOffBoundary.value = false
    isCycleLocked.value = true
    isRequestPending.value = true

    let requestResult: void | Promise<void>

    try {
      requestResult = requestPage()
    }
    catch {
      finishWithoutMutation()
      return
    }

    void Promise.resolve(requestResult).catch(() => {}).finally(() => {
      if (!options.loading.value && isRequestPending.value) {
        finishWithoutMutation()
      }
    })
  }

  function onLoadingChange(isLoading: boolean) {
    if (!isLoading && isRequestPending.value) {
      finishWithoutMutation()
    }
  }

  function onItemsMutated(addedItemCount: number) {
    if (!isRequestPending.value || addedItemCount <= 0) {
      return
    }

    isRequestPending.value = false
    scheduleRelease(options.getAnimationLockMs(addedItemCount))
  }

  function registerIntent() {
    if (!canRegisterIntent()) {
      return
    }

    intentVersion.value += 1
  }

  function canRegisterIntent() {
    return options.hasPage.value
      && !options.interactionLocked?.value
      && !options.loading.value
      && !isCycleLocked.value
      && typeof options.requestPage.value === 'function'
  }

  function canRequestPage() {
    return options.hasPage.value
      && isBoundaryActive.value
      && intentVersion.value > consumedIntentVersion.value
      && !options.interactionLocked?.value
      && !options.loading.value
      && !isCycleLocked.value
      && typeof options.requestPage.value === 'function'
  }

  function finishWithoutMutation() {
    isRequestPending.value = false
    scheduleRelease(EDGE_FAILURE_COOLDOWN_MS)
  }

  function scheduleRelease(delayMs: number) {
    clearReleaseTimer()
    isCycleLocked.value = true

    releaseTimer = setTimeout(() => {
      releaseTimer = null
      isCycleLocked.value = false
      requestDeferredBoundaryIntent()
    }, Math.max(0, delayMs))
  }

  function requestDeferredBoundaryIntent() {
    if (!hasDeferredBoundaryIntent.value) {
      return
    }

    hasDeferredBoundaryIntent.value = false

    if (!options.isAtBoundary()) {
      if (!isRequestPending.value) {
        hasSeenOffBoundary.value = true
      }
      return
    }

    isBoundaryActive.value = true
    registerIntent()
    maybeRequestPage()
  }

  function clearReleaseTimer() {
    if (!releaseTimer) {
      return
    }

    clearTimeout(releaseTimer)
    releaseTimer = null
  }

  function matchesWheelDirection(event: WheelEvent) {
    return options.direction === 'top' ? event.deltaY < 0 : event.deltaY > 0
  }

  return {
    maybeRequestPage,
    onItemsMutated,
    onLoadingChange,
    onWheel,
    syncBoundary,
  }
}
