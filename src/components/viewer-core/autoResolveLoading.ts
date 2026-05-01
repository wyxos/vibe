import type { Ref } from 'vue'
import {
  getVibeBucketVisibleCount,
  replaceVibeBucketAtCursor,
  type VibeAutoBucket,
} from './autoBuckets'
import type { CreateAutoResolveBucket } from './autoResolveBucketFactory'
import { getCursorKey, type ResolveFn, type VibeAutoDirection } from './autoResolveHelpers'
import {
  finalizeCollectedBuckets,
  isAbortError,
  refreshAutoResolveBucket,
  type VibeCollectedBuckets,
} from './autoResolveState'
import { resolveCollectedNextCursor, resolveRefreshedNextCursor } from './autoResolveCursors'
import type { VibeLoadPhase } from './removalState'

export function createAutoResolveLoadingController(options: {
  autoBuckets: Ref<VibeAutoBucket[]>
  clearActiveResolveController: (controller: AbortController | null) => void
  clearFillState: () => void
  createBucket: CreateAutoResolveBucket
  errorMessage: Ref<string | null>
  fillCollectedCount: Ref<number | null>
  fillCursor: Ref<string | null>
  fillTargetCount: Ref<number | null>
  finishLoadPhase: () => void
  getActiveOccurrenceKey: () => string | null
  getBoundaryBucket: (edge: 'leading' | 'trailing') => VibeAutoBucket | null | undefined
  getFillDelayMs: (index: number) => number
  getOperationIsCurrent: (operationId: number) => boolean
  getPageSize: () => number
  getResolve: () => ResolveFn | undefined
  getSequence: () => number
  inFlightCursors: Set<string>
  isManualPageLoadingLocked: Ref<boolean>
  nextOperationId: () => number
  operationPhase: Ref<VibeLoadPhase>
  removedIds: Ref<Set<string>>
  setActiveResolveController: (controller: AbortController | null) => void
  setSequence: (sequence: number) => void
  syncActiveIndexAfterVisibilityChange: (anchorOccurrenceKey: string | null) => void
  waitFillDelay: (delayMs: number) => Promise<void>
}) {
  async function reloadBoundaryBucket(edge: 'leading' | 'trailing') {
    const resolve = options.getResolve()
    const targetBucket = options.getBoundaryBucket(edge)
    if (!resolve || !targetBucket) return null
    const cursorKey = getCursorKey(targetBucket.cursor)
    if (options.inFlightCursors.has(cursorKey)) return null
    options.inFlightCursors.add(cursorKey)
    options.errorMessage.value = null
    options.operationPhase.value = 'refreshing'
    options.clearFillState()
    const operationId = options.nextOperationId()
    const resolveController = typeof AbortController === 'undefined' ? null : new AbortController()
    options.setActiveResolveController(resolveController)
    try {
      const response = await resolve({
        cursor: targetBucket.cursor,
        pageSize: options.getPageSize(),
        signal: resolveController?.signal,
      })
      if (!options.getOperationIsCurrent(operationId)) {
        options.finishLoadPhase()
        return null
      }
      const nextCursorState = resolveRefreshedNextCursor(targetBucket, response.nextPage)
      const refreshed = refreshAutoResolveBucket({
        cursor: targetBucket.cursor,
        nextCursor: nextCursorState.cursor,
        nextCursorExhausted: nextCursorState.exhausted,
        nextItems: response.items,
        previousCursor: response.previousPage ?? null,
        previousItems: targetBucket.items,
        sequence: options.getSequence(),
      })
      options.setSequence(refreshed.nextSequence)
      const anchorOccurrenceKey = options.getActiveOccurrenceKey()
      options.autoBuckets.value = replaceVibeBucketAtCursor(options.autoBuckets.value, targetBucket.cursor, refreshed.bucket)
      options.syncActiveIndexAfterVisibilityChange(anchorOccurrenceKey)
      options.finishLoadPhase()
      return {
        followCursor: edge === 'leading' ? (response.previousPage ?? null) : response.nextPage,
        itemsInserted: refreshed.insertedCount,
      }
    }
    catch (error) {
      if (isAbortError(error) || !options.getOperationIsCurrent(operationId)) {
        options.finishLoadPhase()
        return null
      }
      options.errorMessage.value = error instanceof Error ? error.message : 'The viewer could not load items.'
      options.operationPhase.value = 'failed'
      options.clearFillState()
      return null
    }
    finally {
      options.clearActiveResolveController(resolveController)
      options.inFlightCursors.delete(cursorKey)
    }
  }

  async function collectBuckets(request: {
    continueUntilFilled: boolean
    cursor: string | null
    direction: VibeAutoDirection
    phase: Extract<VibeLoadPhase, 'filling' | 'initializing' | 'loading'>
  }): Promise<VibeCollectedBuckets | null> {
    const resolve = options.getResolve()
    if (!resolve) return null
    const operationId = options.nextOperationId()
    const visitedCursorKeys = new Set<string>()
    const collectedBuckets: VibeAutoBucket[] = []
    let cursor = request.cursor
    let fillRequestIndex = 0
    options.errorMessage.value = null
    options.operationPhase.value = request.phase
    options.clearFillState()
    while (true) {
      if (!options.getOperationIsCurrent(operationId)) return finalizeCollectedBuckets(collectedBuckets, request.direction, options.removedIds.value, true)
      if (collectedBuckets.length > 0 && options.isManualPageLoadingLocked.value) return finalizeCollectedBuckets(collectedBuckets, request.direction, options.removedIds.value, false)
      const cursorKey = getCursorKey(cursor)
      if (visitedCursorKeys.has(cursorKey) || options.inFlightCursors.has(cursorKey)) break
      visitedCursorKeys.add(cursorKey)
      options.inFlightCursors.add(cursorKey)
      const resolveController = typeof AbortController === 'undefined' ? null : new AbortController()
      options.setActiveResolveController(resolveController)
      try {
        const response = await resolve({ cursor, pageSize: options.getPageSize(), signal: resolveController?.signal })
        if (!options.getOperationIsCurrent(operationId)) return finalizeCollectedBuckets(collectedBuckets, request.direction, options.removedIds.value, true)
        const nextCursorState = resolveCollectedNextCursor(request.direction, cursor, response.nextPage)
        const nextBucket = options.createBucket({
          cursor,
          nextCursor: nextCursorState.cursor,
          nextCursorExhausted: nextCursorState.exhausted,
          nextItems: response.items,
          previousCursor: response.previousPage ?? null,
          previousItems: [],
        })
        collectedBuckets.push(nextBucket)
        const visibleCount = collectedBuckets.reduce((count, bucket) => count + getVibeBucketVisibleCount(bucket, options.removedIds.value), 0)
        const nextCursor = request.direction === 'forward' ? (nextBucket.nextCursorExhausted ? null : nextBucket.nextCursor) : nextBucket.previousCursor
        if (!request.continueUntilFilled || visibleCount >= options.getPageSize() || !nextCursor) {
          options.fillCursor.value = null
          return finalizeCollectedBuckets(collectedBuckets, request.direction, options.removedIds.value, false)
        }
        if (options.isManualPageLoadingLocked.value) return finalizeCollectedBuckets(collectedBuckets, request.direction, options.removedIds.value, false)
        options.operationPhase.value = 'filling'
        options.fillCollectedCount.value = visibleCount
        options.fillCursor.value = nextCursor
        options.fillTargetCount.value = options.getPageSize()
        fillRequestIndex += 1
        await options.waitFillDelay(options.getFillDelayMs(fillRequestIndex))
        if (!options.getOperationIsCurrent(operationId)) return finalizeCollectedBuckets(collectedBuckets, request.direction, options.removedIds.value, true)
        cursor = nextCursor
      }
      catch (error) {
        if (isAbortError(error) || !options.getOperationIsCurrent(operationId)) {
          return finalizeCollectedBuckets(collectedBuckets, request.direction, options.removedIds.value, true)
        }
        options.errorMessage.value = error instanceof Error ? error.message : 'The viewer could not load items.'
        options.operationPhase.value = 'failed'
        options.clearFillState()
        return null
      }
      finally {
        options.clearActiveResolveController(resolveController)
        options.inFlightCursors.delete(cursorKey)
      }
    }
    return finalizeCollectedBuckets(collectedBuckets, request.direction, options.removedIds.value, false)
  }

  return {
    collectBuckets,
    reloadBoundaryBucket,
  }
}
