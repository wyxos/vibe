import { onBeforeUnmount, ref, watch, type ComputedRef, type Ref } from 'vue'

import type { VibeViewerItem } from '../vibeViewer'

import type { LayoutPosition } from './masonryLayout'

const CARD_MOTION_MS = 300
const ENTER_MOTION_MS = 600
const ENTER_STAGGER_MS = 40
const MAX_ENTER_STAGGER_TOTAL_MS = 400
export type VibeMasonryEnterDirection = 'bottom' | 'top'

export function getVibeMasonryEnterOrder(itemIds: string[], direction: VibeMasonryEnterDirection) {
  if (direction === 'top') {
    return [...itemIds].reverse()
  }

  return itemIds
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

export function useVibeMasonryMotion(options: {
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
  const moveOffsets = ref<Map<string, { dx: number; dy: number }>>(new Map())
  const moveDurationById = ref<Map<string, number>>(new Map())
  const moveTransitionIds = ref<Set<string>>(new Set())
  const scheduledEnterIds = new Set<string>()
  const activeTimers = new Set<ReturnType<typeof setTimeout>>()

  watch(
    options.visibleIndices,
    (visibleIndices) => {
      if (!visibleIndices.length) {
        return
      }

      const idsToAnimate: string[] = []

      for (const index of visibleIndices) {
        const itemId = options.items.value[index]?.id
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
        }, ENTER_MOTION_MS)
      })
    },
    { flush: 'post' },
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

    const nextStartIds = new Set(enterStartIds.value)
    const nextEnterDirectionById = new Map(enterDirectionById.value)
    for (const item of items) {
      nextStartIds.add(item.id)
      nextEnterDirectionById.set(item.id, direction)
    }
    enterStartIds.value = nextStartIds
    enterDirectionById.value = nextEnterDirectionById
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
    const moveOffset = item ? moveOffsets.value.get(item.id) ?? { dx: 0, dy: 0 } : { dx: 0, dy: 0 }
    const enterDirection = item ? enterDirectionById.value.get(item.id) ?? 'bottom' : 'bottom'
    const enterStartY = item && enterStartIds.value.has(item.id)
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
    markEnter,
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
