import { onUnmounted, ref, watch, type ComputedRef, type Ref, type ShallowRef } from 'vue'
import type { MasonryItemDefinition } from '@/components/masonryItemRegistry'
import type { MasonryItemBase } from '@/masonry/types'
import type { LeavingClone, MasonryFailurePayload, MasonryPosition } from '@/components/masonry/types'

type UseMasonryMotionOptions = {
  itemDefinition: ShallowRef<MasonryItemDefinition | null>
  itemsState: Ref<MasonryItemBase[]>
  visibleIndices: ComputedRef<number[]>
  layoutPositions: Ref<MasonryPosition[]>
  layoutHeights: Ref<number[]>
  layoutIndexById: Ref<Map<string, number>>
  columnWidth: ComputedRef<number>
  scrollTop: Ref<number>
  viewportHeight: Ref<number>
  enterStaggerMs: ComputedRef<number>
  isResumeMode: Ref<boolean>
  emitPreloaded: (items: MasonryItemBase[]) => void
  emitFailures: (payloads: MasonryFailurePayload[]) => void
}

const PRELOAD_BATCH_DEBOUNCE_MS = 100
const CARD_MOTION_MS = 300
const ENTER_MOTION_MS = 600
const LEAVE_MOTION_MS = 600
const MAX_ENTER_STAGGER_TOTAL_MS = 400

export function useMasonryMotion(options: UseMasonryMotionOptions) {
  const hoveredCardId = ref<string | null>(null)

  const pendingPreloadedItems: MasonryItemBase[] = []
  const pendingFailurePayloads: MasonryFailurePayload[] = []
  let flushPreloadedTimer: ReturnType<typeof setTimeout> | null = null
  let flushFailuresTimer: ReturnType<typeof setTimeout> | null = null

  const enterStartIds = ref<Set<string>>(new Set())
  const enterAnimatingIds = ref<Set<string>>(new Set())
  const scheduledEnterIds = new Set<string>()
  const enterDelayById = ref<Map<string, number>>(new Map())

  const moveOffsets = ref<Map<string, { dx: number; dy: number }>>(new Map())
  const moveTransitionIds = ref<Set<string>>(new Set())
  const leavingClones = ref<LeavingClone[]>([])
  const hasPlayedResumeEnter = ref(false)

  const warnedInvalidDimensionsById = new Set<string>()
  const activeTimers = new Set<ReturnType<typeof setTimeout>>()

  function trackTimeout(callback: () => void, delayMs: number) {
    const timer = setTimeout(() => {
      activeTimers.delete(timer)
      callback()
    }, delayMs)
    activeTimers.add(timer)
    return timer
  }

  function clearActiveTimers() {
    for (const timer of activeTimers) {
      clearTimeout(timer)
    }
    activeTimers.clear()
  }

  function flushPreloaded() {
    if (!pendingPreloadedItems.length) return
    const batch = pendingPreloadedItems.splice(0, pendingPreloadedItems.length)
    options.emitPreloaded(batch)
  }

  function flushFailures() {
    if (!pendingFailurePayloads.length) return
    const batch = pendingFailurePayloads.splice(0, pendingFailurePayloads.length)
    options.emitFailures(batch)
  }

  function clearPendingBatchState() {
    pendingPreloadedItems.splice(0, pendingPreloadedItems.length)
    pendingFailurePayloads.splice(0, pendingFailurePayloads.length)
    if (flushPreloadedTimer) {
      clearTimeout(flushPreloadedTimer)
      flushPreloadedTimer = null
    }
    if (flushFailuresTimer) {
      clearTimeout(flushFailuresTimer)
      flushFailuresTimer = null
    }
  }

  function scheduleFlushPreloaded() {
    if (flushPreloadedTimer) return
    flushPreloadedTimer = setTimeout(() => {
      flushPreloadedTimer = null
      flushPreloaded()
    }, PRELOAD_BATCH_DEBOUNCE_MS)
  }

  function scheduleFlushFailures() {
    if (flushFailuresTimer) return
    flushFailuresTimer = setTimeout(() => {
      flushFailuresTimer = null
      flushFailures()
    }, PRELOAD_BATCH_DEBOUNCE_MS)
  }

  function handleItemPreloaded(item: MasonryItemBase) {
    options.itemDefinition.value?.onPreloaded?.(item)
    pendingPreloadedItems.push(item)
    scheduleFlushPreloaded()
  }

  function handleItemFailed(payload: MasonryFailurePayload) {
    options.itemDefinition.value?.onFailed?.(payload)
    pendingFailurePayloads.push(payload)
    scheduleFlushFailures()
  }

  function handleCardMouseEnter(id: string) {
    hoveredCardId.value = id
  }

  function handleCardMouseLeave(id: string) {
    if (hoveredCardId.value === id) {
      hoveredCardId.value = null
    }
  }

  function getOutsideViewportBottomY(height: number): number {
    const safeHeight = typeof height === 'number' && Number.isFinite(height) ? height : 0
    return options.scrollTop.value + options.viewportHeight.value + Math.max(0, safeHeight)
  }

  function clampEnterStaggerMs(delayMs: number): number {
    if (!Number.isFinite(delayMs)) return 0
    return Math.max(0, Math.min(250, delayMs))
  }

  function getCardTransitionDelay(id: string): string | undefined {
    if (!enterAnimatingIds.value.has(id)) return undefined
    const delayMs = enterDelayById.value.get(id) ?? 0
    return delayMs > 0 ? `${delayMs}ms` : undefined
  }

  function getMoveOffset(id: string): { dx: number; dy: number } {
    return moveOffsets.value.get(id) ?? { dx: 0, dy: 0 }
  }

  function getCardTransition(id: string): string | undefined {
    if (enterAnimatingIds.value.has(id)) return `transform ${ENTER_MOTION_MS}ms ease-out`
    if (moveTransitionIds.value.has(id)) return `transform ${CARD_MOTION_MS}ms ease-out`
    return undefined
  }

  function getCardTransform(index: number): string {
    const item = options.itemsState.value[index]
    const itemId = item?.id
    const position = options.layoutPositions.value[index] ?? { x: 0, y: 0 }
    const enterHeight = options.layoutHeights.value[index] ?? 0
    const enterOffset = enterHeight > 0 ? enterHeight : options.columnWidth.value
    const startY =
      itemId && enterStartIds.value.has(itemId)
        ? getOutsideViewportBottomY(enterOffset)
        : position.y
    const offset = itemId ? getMoveOffset(itemId) : { dx: 0, dy: 0 }
    return `translate3d(${position.x + offset.dx}px,${startY + offset.dy}px,0)`
  }

  function raf(callback: () => void) {
    const frame =
      typeof requestAnimationFrame === 'function'
        ? requestAnimationFrame
        : (cb: FrameRequestCallback) => setTimeout(() => cb(0), 0) as unknown as number
    frame(() => callback())
  }

  function raf2(callback: () => void) {
    raf(() => raf(callback))
  }

  function isValidDimension(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value) && value > 0
  }

  function markEnterFromTop(items: MasonryItemBase[]) {
    if (!Array.isArray(items) || items.length === 0) return

    const next = new Set(enterStartIds.value)
    let changed = false

    for (const item of items) {
      const itemId = item?.id
      if (!itemId) continue

      if (!warnedInvalidDimensionsById.has(itemId)) {
        const width = item?.width
        const height = item?.height
        if (!isValidDimension(width) || !isValidDimension(height)) {
          warnedInvalidDimensionsById.add(itemId)
          console.warn(
            `[Masonry] Item "${itemId}" has invalid dimensions (width=${String(width)}, height=${String(
              height
            )}); layout expects { id, width, height }.`
          )
        }
      }

      if (!next.has(itemId)) {
        next.add(itemId)
        changed = true
      }
    }

    if (changed) {
      enterStartIds.value = next
    }
  }

  function snapshotVisiblePositions(): Map<string, MasonryPosition> {
    const oldPositions = new Map<string, MasonryPosition>()

    for (const visibleIndex of options.visibleIndices.value) {
      const item = options.itemsState.value[visibleIndex]
      const itemId = item?.id
      const position = options.layoutPositions.value[visibleIndex]
      if (!itemId || !position) continue
      oldPositions.set(itemId, { x: position.x, y: position.y })
    }

    return oldPositions
  }

  function playFlipMoveAnimation(oldPosById: Map<string, MasonryPosition>, skipIds?: Set<string>) {
    if (!oldPosById.size) return

    const offsets = new Map<string, { dx: number; dy: number }>()
    const animatingIds: string[] = []

    for (const [itemId, oldPosition] of oldPosById.entries()) {
      if (skipIds?.has(itemId)) continue

      const nextIndex = options.layoutIndexById.value.get(itemId)
      if (nextIndex == null) continue

      const newPosition = options.layoutPositions.value[nextIndex]
      if (!newPosition) continue

      const dx = oldPosition.x - newPosition.x
      const dy = oldPosition.y - newPosition.y
      if (!dx && !dy) continue

      offsets.set(itemId, { dx, dy })
      animatingIds.push(itemId)
    }

    if (!offsets.size) return

    moveOffsets.value = offsets
    const withoutThese = new Set(moveTransitionIds.value)
    for (const itemId of animatingIds) {
      withoutThese.delete(itemId)
    }
    moveTransitionIds.value = withoutThese

    raf(() => {
      moveTransitionIds.value = new Set([...moveTransitionIds.value, ...animatingIds])
      raf(() => {
        moveOffsets.value = new Map()
      })
    })

    trackTimeout(() => {
      const next = new Set(moveTransitionIds.value)
      for (const itemId of animatingIds) {
        next.delete(itemId)
      }
      moveTransitionIds.value = next
    }, CARD_MOTION_MS)
  }

  function queueLeavingClones(clones: LeavingClone[]) {
    if (!clones.length) return

    leavingClones.value = [...leavingClones.value, ...clones]

    const cloneIds = new Set(clones.map((clone) => clone.id))
    raf(() => {
      leavingClones.value = leavingClones.value.map((clone) =>
        cloneIds.has(clone.id) ? { ...clone, leaving: false } : clone
      )
      trackTimeout(() => {
        leavingClones.value = leavingClones.value.filter((clone) => !cloneIds.has(clone.id))
      }, LEAVE_MOTION_MS)
    })
  }

  function resetMotionState() {
    clearActiveTimers()
    clearPendingBatchState()
    hoveredCardId.value = null
    enterStartIds.value = new Set()
    enterAnimatingIds.value = new Set()
    scheduledEnterIds.clear()
    enterDelayById.value = new Map()
    moveOffsets.value = new Map()
    moveTransitionIds.value = new Set()
    leavingClones.value = []
    hasPlayedResumeEnter.value = false
  }

  watch(
    options.visibleIndices,
    (indices) => {
      if (!indices?.length) return

      if (options.isResumeMode.value && !hasPlayedResumeEnter.value) {
        const batch: MasonryItemBase[] = []
        for (const index of indices) {
          const item = options.itemsState.value[index]
          if (item) batch.push(item)
        }
        if (batch.length) {
          markEnterFromTop(batch)
        }
        hasPlayedResumeEnter.value = true
      }

      const idsToSchedule: string[] = []
      for (const index of indices) {
        const itemId = options.itemsState.value[index]?.id
        if (!itemId) continue
        if (!enterStartIds.value.has(itemId)) continue
        if (scheduledEnterIds.has(itemId)) continue
        scheduledEnterIds.add(itemId)
        idsToSchedule.push(itemId)
      }

      if (!idsToSchedule.length) return

      const stepMs = idsToSchedule.length > 1 ? clampEnterStaggerMs(options.enterStaggerMs.value) : 0
      if (stepMs > 0) {
        const next = new Map(enterDelayById.value)
        for (let index = 0; index < idsToSchedule.length; index += 1) {
          const itemId = idsToSchedule[index]
          next.set(itemId, Math.min(index * stepMs, MAX_ENTER_STAGGER_TOTAL_MS))
        }
        enterDelayById.value = next
      }

      raf(() => {
        const next = new Set(enterAnimatingIds.value)
        for (const itemId of idsToSchedule) {
          next.add(itemId)
        }
        enterAnimatingIds.value = next
      })

      raf2(() => {
        const nextStart = new Set(enterStartIds.value)
        for (const itemId of idsToSchedule) {
          nextStart.delete(itemId)
        }
        enterStartIds.value = nextStart

        trackTimeout(() => {
          const nextAnimating = new Set(enterAnimatingIds.value)
          const nextDelay = new Map(enterDelayById.value)
          for (const itemId of idsToSchedule) {
            nextAnimating.delete(itemId)
            scheduledEnterIds.delete(itemId)
            nextDelay.delete(itemId)
          }
          enterAnimatingIds.value = nextAnimating
          enterDelayById.value = nextDelay
        }, ENTER_MOTION_MS)
      })
    },
    { flush: 'post' }
  )

  onUnmounted(() => {
    clearActiveTimers()

    if (flushPreloadedTimer) {
      clearTimeout(flushPreloadedTimer)
      flushPreloadedTimer = null
    }
    if (flushFailuresTimer) {
      clearTimeout(flushFailuresTimer)
      flushFailuresTimer = null
    }

    flushPreloaded()
    flushFailures()
  })

  return {
    hoveredCardId,
    leavingClones,
    handleCardMouseEnter,
    handleCardMouseLeave,
    handleItemPreloaded,
    handleItemFailed,
    getCardTransition,
    getCardTransitionDelay,
    getCardTransform,
    markEnterFromTop,
    snapshotVisiblePositions,
    playFlipMoveAnimation,
    queueLeavingClones,
    resetMotionState,
  }
}
