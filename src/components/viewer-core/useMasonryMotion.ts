import { computed, onBeforeUnmount, ref, watch, type ComputedRef, type Ref } from 'vue'

import type { VibeViewerItem } from '../viewer'

import type { LayoutPosition } from './masonryLayout'
import { getVibeOccurrenceKey } from './itemIdentity'

const CARD_MOTION_MS = 300
const ENTER_MOTION_MS = 600
const ENTER_STAGGER_MS = 40
const LEAVE_MOTION_MS = 300
const MAX_ENTER_STAGGER_TOTAL_MS = 400
const MAX_PENDING_ENTER_ITEMS = 300
export type VibeMasonryEnterDirection = 'bottom' | 'top'
export interface VibeMasonryLeavingItem {
  height: number
  item: VibeViewerItem
  position: LayoutPosition
}

export function getVibeMasonryEnterOrder(itemIds: string[], direction: VibeMasonryEnterDirection) {
  if (direction === 'top') {
    return [...itemIds].reverse()
  }

  return itemIds
}

export function getVibeMasonryEnterDuration(itemCount: number) {
  if (itemCount <= 0) {
    return ENTER_MOTION_MS
  }

  return ENTER_MOTION_MS + Math.min((itemCount - 1) * ENTER_STAGGER_MS, MAX_ENTER_STAGGER_TOTAL_MS)
}

export function shouldWindowVibeMasonryEnterTracking(pendingCount: number, addedCount: number, maxPendingItems = MAX_PENDING_ENTER_ITEMS) {
  return pendingCount + addedCount > maxPendingItems
}

export function getVibeMasonryLeaveDuration() {
  return LEAVE_MOTION_MS
}

export function getVibeMasonryEnterStartY(options: {
  direction: VibeMasonryEnterDirection
  itemHeight: number
  columnWidth: number
  scrollTop: number
  viewportHeight: number
}) {
  const safeHeight = options.itemHeight > 0 ? options.itemHeight : options.columnWidth

  if (options.direction === 'top') {
    return options.scrollTop - safeHeight
  }

  return options.scrollTop + options.viewportHeight + safeHeight
}

export function useMasonryMotion(options: {
  items: Ref<VibeViewerItem[]>
  visibleIndices: ComputedRef<number[]>
  positions: Ref<LayoutPosition[]>
  heights: Ref<number[]>
  indexById: Ref<Map<string, number>>
  columnWidth: ComputedRef<number>
  scrollTop: Ref<number>
  viewportHeight: Ref<number>
}) {
  const enterStartIds = ref<Set<string>>(new Set())
  const enterAnimatingIds = ref<Set<string>>(new Set())
  const enterDelayById = ref<Map<string, number>>(new Map())
  const enterDirectionById = ref<Map<string, VibeMasonryEnterDirection>>(new Map())
  const leavingItemsById = ref<Map<string, VibeMasonryLeavingItem>>(new Map())
  const leaveAnimatingIds = ref<Set<string>>(new Set())
  const moveOffsets = ref<Map<string, { dx: number; dy: number }>>(new Map())
  const moveDurationById = ref<Map<string, number>>(new Map())
  const moveTransitionIds = ref<Set<string>>(new Set())
  const scheduledEnterIds = new Set<string>()
  const activeTimers = new Set<ReturnType<typeof setTimeout>>()
  const leavingItems = computed(() => Array.from(leavingItemsById.value.values()))

  watch(
    options.visibleIndices,
    (visibleIndices) => {
      if (!visibleIndices.length) {
        return
      }

      const idsToAnimate: string[] = []

      for (const index of visibleIndices) {
        const itemId = options.items.value[index] ? getVibeOccurrenceKey(options.items.value[index]) : null
        if (!itemId || !enterStartIds.value.has(itemId) || scheduledEnterIds.has(itemId)) {
          continue
        }

        scheduledEnterIds.add(itemId)
        idsToAnimate.push(itemId)
      }

      if (!idsToAnimate.length) {
        return
      }

      const enterDirection = enterDirectionById.value.get(idsToAnimate[0]) ?? 'bottom'
      const orderedIdsToAnimate = getVibeMasonryEnterOrder(idsToAnimate, enterDirection)
      const nextDelayById = new Map(enterDelayById.value)
      for (let index = 0; index < orderedIdsToAnimate.length; index += 1) {
        nextDelayById.set(orderedIdsToAnimate[index], Math.min(index * ENTER_STAGGER_MS, MAX_ENTER_STAGGER_TOTAL_MS))
      }
      enterDelayById.value = nextDelayById

      raf(() => {
        const nextAnimatingIds = new Set(enterAnimatingIds.value)
        for (const itemId of idsToAnimate) {
          nextAnimatingIds.add(itemId)
        }
        enterAnimatingIds.value = nextAnimatingIds
      })

      raf2(() => {
        const nextStartIds = new Set(enterStartIds.value)
        for (const itemId of idsToAnimate) {
          nextStartIds.delete(itemId)
        }
        enterStartIds.value = nextStartIds

        trackTimeout(() => {
          const nextAnimatingIds = new Set(enterAnimatingIds.value)
          const nextDelayById = new Map(enterDelayById.value)
          const nextEnterDirectionById = new Map(enterDirectionById.value)
          for (const itemId of idsToAnimate) {
            nextAnimatingIds.delete(itemId)
            nextDelayById.delete(itemId)
            nextEnterDirectionById.delete(itemId)
            scheduledEnterIds.delete(itemId)
          }
          enterAnimatingIds.value = nextAnimatingIds
          enterDelayById.value = nextDelayById
          enterDirectionById.value = nextEnterDirectionById
        }, getVibeMasonryEnterDuration(idsToAnimate.length))
      })
    },
    { flush: 'post' },
  )

  watch(
    () => options.items.value.map((item) => getVibeOccurrenceKey(item)),
    (itemIds) => {
      if (!itemIds.length || !leavingItemsById.value.size) {
        return
      }

      const currentIds = new Set(itemIds)
      let nextLeavingItemsById: Map<string, VibeMasonryLeavingItem> | null = null
      let nextLeaveAnimatingIds: Set<string> | null = null

      for (const leavingItemId of leavingItemsById.value.keys()) {
        if (!currentIds.has(leavingItemId)) {
          continue
        }

        if (!nextLeavingItemsById) {
          nextLeavingItemsById = new Map(leavingItemsById.value)
        }
        if (!nextLeaveAnimatingIds) {
          nextLeaveAnimatingIds = new Set(leaveAnimatingIds.value)
        }

        nextLeavingItemsById.delete(leavingItemId)
        nextLeaveAnimatingIds.delete(leavingItemId)
      }

      if (nextLeavingItemsById) {
        leavingItemsById.value = nextLeavingItemsById
      }
      if (nextLeaveAnimatingIds) {
        leaveAnimatingIds.value = nextLeaveAnimatingIds
      }
    },
  )

  onBeforeUnmount(() => {
    for (const timer of activeTimers) {
      clearTimeout(timer)
    }
    activeTimers.clear()
  })

  function markEnter(items: VibeViewerItem[], direction: VibeMasonryEnterDirection = 'bottom') {
    if (!items.length) {
      return
    }

    const windowEnterTracking = shouldWindowVibeMasonryEnterTracking(enterStartIds.value.size, items.length)
    const renderedIndices = windowEnterTracking ? new Set(options.visibleIndices.value) : null
    const nextStartIds = renderedIndices ? getRenderedPendingEnterIds(renderedIndices) : new Set(enterStartIds.value)
    const nextEnterDirectionById = windowEnterTracking ? getRenderedEnterDirections(nextStartIds) : new Map(enterDirectionById.value)

    for (const item of items) {
      const itemId = getVibeOccurrenceKey(item)
      const itemIndex = windowEnterTracking ? options.indexById.value.get(itemId) : null
      if (renderedIndices && (itemIndex == null || !renderedIndices.has(itemIndex))) {
        continue
      }

      nextStartIds.add(itemId)
      nextEnterDirectionById.set(itemId, direction)
    }

    enterStartIds.value = nextStartIds
    enterDirectionById.value = nextEnterDirectionById
  }

  function getRenderedPendingEnterIds(renderedIndices: Set<number>) {
    const nextStartIds = new Set<string>()

    for (const index of renderedIndices) {
      const item = options.items.value[index]
      const itemId = item ? getVibeOccurrenceKey(item) : null
      if (itemId && enterStartIds.value.has(itemId)) {
        nextStartIds.add(itemId)
      }
    }

    for (const itemId of scheduledEnterIds) {
      if (enterStartIds.value.has(itemId)) {
        nextStartIds.add(itemId)
      }
    }

    for (const itemId of enterAnimatingIds.value) {
      if (enterStartIds.value.has(itemId)) {
        nextStartIds.add(itemId)
      }
    }

    return nextStartIds
  }

  function getRenderedEnterDirections(nextStartIds: Set<string>) {
    const nextEnterDirectionById = new Map<string, VibeMasonryEnterDirection>()

    for (const itemId of nextStartIds) {
      const direction = enterDirectionById.value.get(itemId)
      if (direction) {
        nextEnterDirectionById.set(itemId, direction)
      }
    }

    return nextEnterDirectionById
  }

  function markLeave(items: VibeMasonryLeavingItem[]) {
    if (!items.length) {
      return
    }

    const nextLeavingItemsById = new Map(leavingItemsById.value)
    const nextEnterStartIds = new Set(enterStartIds.value)
    const nextEnterAnimatingIds = new Set(enterAnimatingIds.value)
    const nextEnterDelayById = new Map(enterDelayById.value)
    const nextEnterDirectionById = new Map(enterDirectionById.value)
    const leavingItemIds: string[] = []

    for (const leavingItem of items) {
      const itemId = getVibeOccurrenceKey(leavingItem.item)
      leavingItemIds.push(itemId)
      nextLeavingItemsById.set(itemId, leavingItem)
      nextEnterStartIds.delete(itemId)
      nextEnterAnimatingIds.delete(itemId)
      nextEnterDelayById.delete(itemId)
      nextEnterDirectionById.delete(itemId)
      scheduledEnterIds.delete(itemId)
    }

    leavingItemsById.value = nextLeavingItemsById
    enterStartIds.value = nextEnterStartIds
    enterAnimatingIds.value = nextEnterAnimatingIds
    enterDelayById.value = nextEnterDelayById
    enterDirectionById.value = nextEnterDirectionById

    raf(() => {
      const nextLeaveAnimatingIds = new Set(leaveAnimatingIds.value)
      for (const itemId of leavingItemIds) {
        nextLeaveAnimatingIds.add(itemId)
      }
      leaveAnimatingIds.value = nextLeaveAnimatingIds
    })

    trackTimeout(() => {
      const nextLeavingItemsById = new Map(leavingItemsById.value)
      const nextLeaveAnimatingIds = new Set(leaveAnimatingIds.value)

      for (const itemId of leavingItemIds) {
        nextLeavingItemsById.delete(itemId)
        nextLeaveAnimatingIds.delete(itemId)
      }

      leavingItemsById.value = nextLeavingItemsById
      leaveAnimatingIds.value = nextLeaveAnimatingIds
    }, LEAVE_MOTION_MS)
  }

  function playFlipMoveAnimation(oldPositionsById: Map<string, LayoutPosition>, skipIds?: Set<string>, durationMs = CARD_MOTION_MS) {
    if (!oldPositionsById.size) {
      return
    }

    const nextMoveOffsets = new Map<string, { dx: number; dy: number }>()
    const animatingIds: string[] = []

    for (const [itemId, oldPosition] of oldPositionsById.entries()) {
      if (skipIds?.has(itemId)) {
        continue
      }

      const nextIndex = options.indexById.value.get(itemId)
      if (nextIndex == null) {
        continue
      }

      const nextPosition = options.positions.value[nextIndex]
      if (!nextPosition) {
        continue
      }

      const dx = oldPosition.x - nextPosition.x
      const dy = oldPosition.y - nextPosition.y
      if (!dx && !dy) {
        continue
      }

      nextMoveOffsets.set(itemId, { dx, dy })
      animatingIds.push(itemId)
    }

    if (!nextMoveOffsets.size) {
      return
    }

    moveOffsets.value = nextMoveOffsets
    moveTransitionIds.value = new Set()
    const nextMoveDurationById = new Map(moveDurationById.value)
    for (const itemId of animatingIds) {
      nextMoveDurationById.set(itemId, durationMs)
    }
    moveDurationById.value = nextMoveDurationById

    raf(() => {
      moveTransitionIds.value = new Set(animatingIds)
      raf(() => {
        moveOffsets.value = new Map()
      })
    })

    trackTimeout(() => {
      moveTransitionIds.value = new Set()
      const nextMoveDurationById = new Map(moveDurationById.value)
      for (const itemId of animatingIds) {
        nextMoveDurationById.delete(itemId)
      }
      moveDurationById.value = nextMoveDurationById
    }, durationMs)
  }

  function getCardTransition(itemId: string) {
    if (enterAnimatingIds.value.has(itemId)) {
      return `transform ${ENTER_MOTION_MS}ms ease-out`
    }

    if (moveTransitionIds.value.has(itemId)) {
      return `transform ${moveDurationById.value.get(itemId) ?? CARD_MOTION_MS}ms ease-out`
    }

    return undefined
  }

  function getCardTransitionDelay(itemId: string) {
    if (!enterAnimatingIds.value.has(itemId)) {
      return undefined
    }

    const delayMs = enterDelayById.value.get(itemId) ?? 0
    return delayMs > 0 ? `${delayMs}ms` : undefined
  }

  function getCardTransform(index: number) {
    const item = options.items.value[index]
    const position = options.positions.value[index] ?? { x: 0, y: 0 }
    const height = options.heights.value[index] ?? options.columnWidth.value
    const itemId = item ? getVibeOccurrenceKey(item) : null
    const moveOffset = itemId ? moveOffsets.value.get(itemId) ?? { dx: 0, dy: 0 } : { dx: 0, dy: 0 }
    const enterDirection = itemId ? enterDirectionById.value.get(itemId) ?? 'bottom' : 'bottom'
    const enterStartY = itemId && enterStartIds.value.has(itemId)
      ? getVibeMasonryEnterStartY({
          columnWidth: options.columnWidth.value,
          direction: enterDirection,
          itemHeight: height,
          scrollTop: options.scrollTop.value,
          viewportHeight: options.viewportHeight.value,
        })
      : position.y

    return `translate3d(${position.x + moveOffset.dx}px, ${enterStartY + moveOffset.dy}px, 0)`
  }

  function getLeavingCardStyle(item: VibeViewerItem) {
    const itemId = getVibeOccurrenceKey(item)
    const leavingItem = leavingItemsById.value.get(itemId)

    if (!leavingItem) {
      return {
        opacity: '0',
        transform: 'translate3d(0, 0, 0) scale(0.96)',
        transition: `opacity ${LEAVE_MOTION_MS}ms ease-out, transform ${LEAVE_MOTION_MS}ms ease-out`,
      }
    }

    const isAnimatingLeave = leaveAnimatingIds.value.has(itemId)

    return {
      height: `${leavingItem.height}px`,
      opacity: isAnimatingLeave ? '0' : '1',
      transform: `translate3d(${leavingItem.position.x}px, ${leavingItem.position.y}px, 0) scale(${isAnimatingLeave ? '0.96' : '1'})`,
      transition: `opacity ${LEAVE_MOTION_MS}ms ease-out, transform ${LEAVE_MOTION_MS}ms ease-out`,
      width: `${options.columnWidth.value}px`,
    }
  }

  function trackTimeout(callback: () => void, delayMs: number) {
    const timer = setTimeout(() => {
      activeTimers.delete(timer)
      callback()
    }, delayMs)

    activeTimers.add(timer)
  }

  return {
    getCardTransform,
    getCardTransition,
    getCardTransitionDelay,
    getLeavingCardStyle,
    leavingItems,
    markEnter,
    markLeave,
    playFlipMoveAnimation,
  }
}

function raf(callback: () => void) {
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(() => callback())
    return
  }

  setTimeout(callback, 0)
}

function raf2(callback: () => void) {
  raf(() => raf(callback))
}
