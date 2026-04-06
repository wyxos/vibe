import { onBeforeUnmount, ref, watch, type ComputedRef, type Ref } from 'vue'

import type { VibeViewerItem } from '../vibeViewer'

import type { LayoutPosition } from './masonryLayout'

const CARD_MOTION_MS = 300
const ENTER_MOTION_MS = 600
const ENTER_STAGGER_MS = 40
const MAX_ENTER_STAGGER_TOTAL_MS = 400

export function getVibeMasonryEnterStartY(options: {
  itemTop: number
  itemHeight: number
  columnWidth: number
  scrollTop: number
  viewportHeight: number
}) {
  const safeHeight = options.itemHeight > 0 ? options.itemHeight : options.columnWidth
  return options.scrollTop + options.viewportHeight + safeHeight + options.itemTop
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
  const moveOffsets = ref<Map<string, { dx: number; dy: number }>>(new Map())
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

      idsToAnimate.sort((leftId, rightId) => {
        const leftIndex = options.indexById.value.get(leftId) ?? -1
        const rightIndex = options.indexById.value.get(rightId) ?? -1
        const leftPosition = leftIndex >= 0 ? options.positions.value[leftIndex] : null
        const rightPosition = rightIndex >= 0 ? options.positions.value[rightIndex] : null

        const yDelta = (rightPosition?.y ?? 0) - (leftPosition?.y ?? 0)
        if (yDelta !== 0) {
          return yDelta
        }

        return (leftPosition?.x ?? 0) - (rightPosition?.x ?? 0)
      })

      const nextDelayById = new Map(enterDelayById.value)
      for (let index = 0; index < idsToAnimate.length; index += 1) {
        nextDelayById.set(idsToAnimate[index], Math.min(index * ENTER_STAGGER_MS, MAX_ENTER_STAGGER_TOTAL_MS))
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
        raf(() => {
          const nextStartIds = new Set(enterStartIds.value)
          for (const itemId of idsToAnimate) {
            nextStartIds.delete(itemId)
          }
          enterStartIds.value = nextStartIds

          trackTimeout(() => {
            const nextAnimatingIds = new Set(enterAnimatingIds.value)
            const nextDelayById = new Map(enterDelayById.value)
            for (const itemId of idsToAnimate) {
              nextAnimatingIds.delete(itemId)
              nextDelayById.delete(itemId)
              scheduledEnterIds.delete(itemId)
            }
            enterAnimatingIds.value = nextAnimatingIds
            enterDelayById.value = nextDelayById
          }, ENTER_MOTION_MS)
        })
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

  function markEnter(items: VibeViewerItem[]) {
    if (!items.length) {
      return
    }

    const nextStartIds = new Set(enterStartIds.value)
    for (const item of items) {
      nextStartIds.add(item.id)
    }
    enterStartIds.value = nextStartIds
  }

  function playFlipMoveAnimation(oldPositionsById: Map<string, LayoutPosition>, skipIds?: Set<string>) {
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

    raf(() => {
      moveTransitionIds.value = new Set(animatingIds)
      raf(() => {
        moveOffsets.value = new Map()
      })
    })

    trackTimeout(() => {
      moveTransitionIds.value = new Set()
    }, CARD_MOTION_MS)
  }

  function getCardTransition(itemId: string) {
    if (enterAnimatingIds.value.has(itemId)) {
      return `transform ${ENTER_MOTION_MS}ms ease-out`
    }

    if (moveTransitionIds.value.has(itemId)) {
      return `transform ${CARD_MOTION_MS}ms ease-out`
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
    const enterStartY = item && enterStartIds.value.has(item.id)
      ? getVibeMasonryEnterStartY({
          columnWidth: options.columnWidth.value,
          itemHeight: height,
          itemTop: position.y,
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
