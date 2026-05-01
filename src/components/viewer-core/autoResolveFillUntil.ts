import type { Ref } from 'vue'
import type { VibeAutoBucket } from './autoBuckets'
import { getCursorKey, type ResolveFn } from './autoResolveHelpers'
import { markVibeNextCursorExhausted, resolveCollectedNextCursor } from './autoResolveCursors'
import { isAbortError } from './autoResolveState'
import type { CreateAutoResolveBucket } from './autoResolveBucketFactory'
import type { VibeFillMode, VibeLoadPhase } from './removalState'

type ActiveFillMode = Exclude<VibeFillMode, 'idle'>

export function createAutoResolveFillUntilController(options: {
  autoBuckets: Ref<VibeAutoBucket[]>
  clearActiveResolveController: (controller: AbortController | null) => void
  clearFillDelay: (cancel?: boolean) => void
  createBucket: CreateAutoResolveBucket
  errorMessage: Ref<string | null>
  fillCollectedCount: Ref<number | null>
  fillCompletedCalls: Ref<number>
  fillCursor: Ref<string | null>
  fillLoadedCount: Ref<number>
  fillMode: Ref<VibeFillMode>
  fillProgress: Ref<number | null>
  fillTargetCalls: Ref<number | null>
  fillTargetCount: Ref<number | null>
  fillTotalCount: Ref<number | null>
  finishLoadPhase: () => void
  getHasNextPage: () => boolean
  getFillDelayMs: (fillRequestIndex: number) => number
  getIsLoading: () => boolean
  getIsManualPageLoadingLocked: () => boolean
  getLoadedItemCount: () => number
  getNextCursor: () => string | null
  getOperationIsCurrent: (operationId: number) => boolean
  getPageSize: () => number
  getResolve: () => ResolveFn | undefined
  getTrailingBoundaryBucket: () => VibeAutoBucket | null
  getVisibleItemCount: () => number
  inFlightCursors: Set<string>
  isAwaitingAppendCommit: Ref<boolean>
  isFillUntilActive: Ref<boolean>
  nextOperationId: () => number
  operationPhase: Ref<VibeLoadPhase>
  pendingAppendBuckets: Ref<VibeAutoBucket[]>
  setActiveResolveController: (controller: AbortController | null) => void
  setLastLoadAttempt: (attempt: () => Promise<void>) => void
  waitFillDelay: (delayMs: number) => Promise<void>
}) {
  async function fillUntil(cursorOrCount: number | string) {
    if (typeof cursorOrCount === 'number') {
      await fillUntilCount(cursorOrCount)
      return
    }

    await runFillUntilSequence('cursor', () => options.getHasNextPage() && options.getNextCursor() !== cursorOrCount)
  }

  async function fillUntilEnd() {
    await runFillUntilSequence('end', () => options.getHasNextPage())
  }

  function cancel() {
    options.isFillUntilActive.value = false
    options.fillMode.value = 'idle'
  }

  async function fillUntilCount(count: number) {
    let remainingCalls = normalizeFillUntilCount(count)

    if (remainingCalls <= 0) {
      return
    }

    await runFillUntilSequence('count', () => options.getHasNextPage() && remainingCalls > 0, () => {
      remainingCalls -= 1
    }, remainingCalls)
  }

  async function runFillUntilSequence(
    mode: ActiveFillMode,
    shouldContinue: () => boolean,
    onCallResolved: () => void = () => {},
    targetCalls: number | null = null,
  ) {
    if (
      !options.getResolve()
      || options.getIsManualPageLoadingLocked()
      || options.isFillUntilActive.value
      || options.getIsLoading()
      || !shouldContinue()
    ) {
      return
    }

    options.isFillUntilActive.value = true
    startFillProgress(mode, targetCalls)
    options.clearFillDelay(true)
    let fillRequestIndex = 0

    try {
      while (shouldContinue()) {
        const cursor = options.getNextCursor()

        if (!cursor || !options.getHasNextPage()) break

        const didResolve = await appendSingleFillPage(cursor, options.getTrailingBoundaryBucket()?.cursor ?? null)

        if (!didResolve || options.operationPhase.value === 'failed') break

        onCallResolved()
        options.fillCompletedCalls.value += 1
        updateFillLoadedCount()
        updateFillProgress()

        if (!shouldContinue()) break

        const nextCursor = options.getNextCursor()
        if (!nextCursor || !options.getHasNextPage()) break

        fillRequestIndex += 1
        options.operationPhase.value = 'filling'
        options.fillCollectedCount.value = options.getVisibleItemCount()
        options.fillCursor.value = nextCursor
        options.fillTargetCount.value = null
        await options.waitFillDelay(options.getFillDelayMs(fillRequestIndex))
        if (!options.isFillUntilActive.value) break
      }
    }
    finally {
      options.isFillUntilActive.value = false
      options.fillCollectedCount.value = null
      options.fillCursor.value = null
      options.fillTargetCount.value = null
      options.fillMode.value = 'idle'
      options.clearFillDelay(true)
      if (options.operationPhase.value !== 'failed') options.finishLoadPhase()
    }
  }

  async function appendSingleFillPage(cursor: string, originCursor: string | null | undefined) {
    options.setLastLoadAttempt(async () => { await appendSingleFillPage(cursor, originCursor) })
    const resolve = options.getResolve()
    if (!resolve) return false

    const cursorKey = getCursorKey(cursor)
    if (options.inFlightCursors.has(cursorKey)) return false

    const operationId = options.nextOperationId()
    const resolveController = typeof AbortController === 'undefined' ? null : new AbortController()
    options.inFlightCursors.add(cursorKey)
    options.setActiveResolveController(resolveController)
    options.errorMessage.value = null
    options.operationPhase.value = 'filling'
    options.fillCollectedCount.value = options.getVisibleItemCount()
    options.fillCursor.value = cursor
    options.fillTargetCount.value = null
    options.pendingAppendBuckets.value = []
    options.isAwaitingAppendCommit.value = false

    try {
      const response = await resolve({
        cursor,
        pageSize: options.getPageSize(),
        signal: resolveController?.signal,
      })
      if (!options.getOperationIsCurrent(operationId)) {
        options.finishLoadPhase()
        return false
      }

      applyResolveTotal(response.total)
      if (!response.items.length) {
        options.autoBuckets.value = response.nextPage
          ? skipEmptyForwardCursor(options.autoBuckets.value, originCursor, cursor, response.nextPage)
          : markVibeNextCursorExhausted(options.autoBuckets.value, originCursor, cursor, true)
        updateFillLoadedCount()
        options.finishLoadPhase()
        return true
      }

      const nextCursorState = resolveCollectedNextCursor('forward', cursor, response.nextPage)
      options.autoBuckets.value = [...options.autoBuckets.value, options.createBucket({
        cursor,
        nextCursor: nextCursorState.cursor,
        nextCursorExhausted: nextCursorState.exhausted,
        nextItems: response.items,
        previousCursor: response.previousPage ?? null,
        previousItems: [],
      })]
      updateFillLoadedCount()
      options.finishLoadPhase()
      return true
    }
    catch (error) {
      if (isAbortError(error) || !options.getOperationIsCurrent(operationId)) {
        options.finishLoadPhase()
        return false
      }
      options.errorMessage.value = error instanceof Error ? error.message : 'The viewer could not load items.'
      options.operationPhase.value = 'failed'
      options.fillCollectedCount.value = null
      options.fillCursor.value = null
      options.fillTargetCount.value = null
      return false
    }
    finally {
      options.clearActiveResolveController(resolveController)
      options.inFlightCursors.delete(cursorKey)
    }
  }

  function startFillProgress(mode: ActiveFillMode, targetCalls: number | null) {
    options.fillMode.value = mode
    options.fillCompletedCalls.value = 0
    options.fillLoadedCount.value = options.getLoadedItemCount()
    options.fillProgress.value = targetCalls && targetCalls > 0 ? 0 : null
    options.fillTargetCalls.value = targetCalls
    options.fillTotalCount.value = null
  }

  function updateFillLoadedCount() {
    options.fillLoadedCount.value = options.getLoadedItemCount()
  }

  function updateFillProgress() {
    if (options.fillMode.value === 'count') {
      const targetCalls = options.fillTargetCalls.value
      options.fillProgress.value = targetCalls && targetCalls > 0
        ? clampProgress(options.fillCompletedCalls.value / targetCalls)
        : null
      return
    }

    if (options.fillMode.value === 'end') {
      const totalCount = options.fillTotalCount.value
      if (totalCount === null) {
        options.fillProgress.value = null
        return
      }

      options.fillProgress.value = totalCount <= 0
        ? 1
        : clampProgress(options.fillLoadedCount.value / totalCount)
      return
    }

    options.fillProgress.value = null
  }

  function applyResolveTotal(total: number | null | undefined) {
    if (typeof total === 'number' && Number.isFinite(total) && total >= 0) {
      options.fillTotalCount.value = Math.floor(total)
    }
  }

  return {
    cancel,
    fillUntil,
    fillUntilEnd,
  }
}

function normalizeFillUntilCount(count: number) {
  return Number.isFinite(count) && count > 0 ? Math.floor(count) : 0
}

function clampProgress(value: number) {
  return Math.min(Math.max(value, 0), 1)
}

function skipEmptyForwardCursor(
  buckets: VibeAutoBucket[],
  originCursor: string | null | undefined,
  cursor: string,
  nextCursor: string,
) {
  if (originCursor === undefined) return buckets

  return buckets.map((bucket) => bucket.cursor === originCursor && bucket.nextCursor === cursor
    ? { ...bucket, nextCursor, nextCursorExhausted: false }
    : bucket)
}
