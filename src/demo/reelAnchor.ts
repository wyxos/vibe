import { nextTick } from 'vue'

import {
  findNearestMasonryItemIndex,
  type MasonryLayout,
} from '@/demo/masonry'

const RESIZE_QUIET_MS = 160

interface ReelAnchorItem {
  postId: number
}

interface ReelAnchorOptions {
  getContentTop: () => number
  getGallery: () => HTMLElement | null
  getItems: () => readonly ReelAnchorItem[]
  getLayout: () => MasonryLayout
  isSingleColumn: () => boolean
  measureViewport: () => void
  settleLayout: () => void
  setScrollTop: (scrollTop: number) => void
  setTransitioning: (transitioning: boolean) => void
}

export interface ReelAnchorController {
  capture: () => void
  dispose: () => void
  isTransitioning: () => boolean
  restore: () => void
}

export function createReelAnchorController(
  options: ReelAnchorOptions,
): ReelAnchorController {
  let activitySequence = 0
  let pendingPostId: number | null = null
  let settleFrame: number | null = null
  let settleTimer: ReturnType<typeof setTimeout> | null = null
  let transitioning = false

  function cancelSettle(): void {
    if (settleTimer !== null) clearTimeout(settleTimer)
    if (settleFrame !== null) cancelAnimationFrame(settleFrame)

    settleTimer = null
    settleFrame = null
  }

  function setTransitioning(nextTransitioning: boolean): void {
    if (transitioning === nextTransitioning) return

    transitioning = nextTransitioning
    options.setTransitioning(nextTransitioning)
  }

  function capturePost(): void {
    const gallery = options.getGallery()
    const items = options.getItems()
    const layout = options.getLayout()
    if (!gallery || items.length === 0) return

    const index = findNearestMasonryItemIndex(
      layout.items,
      gallery.scrollTop - options.getContentTop(),
    )
    pendingPostId = index === null ? null : items[index]?.postId ?? null
  }

  function restorePosition(): void {
    const postId = pendingPostId
    const gallery = options.getGallery()
    if (postId === null || !gallery || !options.isSingleColumn()) return

    options.measureViewport()

    const index = options.getItems().findIndex((item) => item.postId === postId)
    const position = options.getLayout().items[index]
    if (!position) return

    const scrollTop = Math.max(0, options.getContentTop() + position.y)
    gallery.scrollTop = scrollTop
    options.setScrollTop(scrollTop)
  }

  function scheduleSettle(sequence: number): void {
    settleTimer = setTimeout(() => {
      settleTimer = null
      if (sequence !== activitySequence) return

      options.settleLayout()
      void nextTick().then(() => {
        if (sequence !== activitySequence) return

        restorePosition()
        settleFrame = requestAnimationFrame(() => {
          if (sequence !== activitySequence) return

          settleFrame = requestAnimationFrame(() => {
            if (sequence !== activitySequence) return

            setTransitioning(false)
            void nextTick().then(() => {
              if (sequence !== activitySequence) return

              restorePosition()
              settleFrame = requestAnimationFrame(() => {
                if (sequence !== activitySequence) return

                restorePosition()
                settleFrame = null
                pendingPostId = null
              })
            })
          })
        })
      })
    }, RESIZE_QUIET_MS)
  }

  function capture(): void {
    if (!transitioning) {
      if (!options.isSingleColumn()) return
      capturePost()
      if (pendingPostId === null) return

      setTransitioning(true)
    }

    activitySequence += 1
    cancelSettle()
  }

  function restore(): void {
    if (!transitioning) return

    const sequence = activitySequence
    void nextTick().then(() => {
      if (sequence !== activitySequence) return

      restorePosition()
      scheduleSettle(sequence)
    })
  }

  function dispose(): void {
    activitySequence += 1
    cancelSettle()
    pendingPostId = null
    setTransitioning(false)
  }

  return {
    capture,
    dispose,
    isTransitioning: () => transitioning,
    restore,
  }
}
