import { computed, ref, type Ref } from 'vue'
import { getVibeMasonryScrollbarThumbStyle } from './masonryViewport'

const SCROLLBAR_INSET_PX = 24
const SCROLLBAR_MIN_THUMB_HEIGHT_PX = 48

export function useMasonryAutoScroll(options: {
  active: Ref<boolean>
  getMaxScrollTop: () => number
  getViewport: () => HTMLElement | null
  onScroll: () => void
}) {
  const speedPxPerSecond = ref(0)
  let frame = 0
  let lastTimestamp = 0

  function autoScroll(speed: number) {
    speedPxPerSecond.value = normalizeAutoScrollSpeed(speed)
    if (speedPxPerSecond.value <= 0) {
      stop()
      return
    }

    start()
  }

  function start() {
    if (frame || speedPxPerSecond.value <= 0 || !options.active.value || typeof requestAnimationFrame === 'undefined') {
      return
    }

    frame = requestAnimationFrame(step)
  }

  function stop() {
    if (frame && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(frame)
    }

    frame = 0
    lastTimestamp = 0
  }

  function step(timestamp: number) {
    frame = 0

    if (!options.active.value || speedPxPerSecond.value <= 0) {
      stop()
      return
    }

    const viewport = options.getViewport()
    if (viewport && lastTimestamp > 0) {
      const elapsedMs = Math.min(Math.max(0, timestamp - lastTimestamp), 250)
      const distancePx = (speedPxPerSecond.value * elapsedMs) / 1_000
      viewport.scrollTop = clamp(viewport.scrollTop + distancePx, 0, options.getMaxScrollTop())
      options.onScroll()
    }

    lastTimestamp = timestamp
    start()
  }

  return {
    autoScroll,
    start,
    stop,
  }
}

export function getLeadingBoundaryLoadProgress(options: {
  active: boolean
  maxScrollTop: number
  progressDistancePx: number
  thresholdPx: number
  triggerEnabled: boolean
}) {
  if (!options.active || !options.triggerEnabled) return 0

  const progressRangePx = Math.max(0, options.maxScrollTop - options.thresholdPx)
  if (progressRangePx <= 0) return 1

  return clamp(1 - ((options.progressDistancePx - options.thresholdPx) / progressRangePx), 0, 1)
}

export function getTrailingBoundaryLoadProgress(options: {
  active: boolean
  maxScrollTop: number
  progressDistancePx: number
  thresholdPx: number
  triggerEnabled: boolean
}) {
  if (!options.active || !options.triggerEnabled) return 0

  const progressRangePx = Math.max(0, options.maxScrollTop - options.thresholdPx)
  if (progressRangePx <= 0) return 1

  return clamp(options.progressDistancePx / progressRangePx, 0, 1)
}

export function useMasonryScrollbar(options: {
  containerHeight: Ref<number>
  scrollTop: Ref<number>
  viewportHeight: Ref<number>
}) {
  const scrollbarTrackHeight = computed(() => Math.max(0, options.viewportHeight.value - SCROLLBAR_INSET_PX * 2))
  const showScrollbar = computed(() => options.containerHeight.value > options.viewportHeight.value + 1 && scrollbarTrackHeight.value > 0)
  const scrollbarThumbHeight = computed(() => {
    if (!showScrollbar.value) return 0
    const rawThumbHeight = (options.viewportHeight.value / options.containerHeight.value) * scrollbarTrackHeight.value
    return Math.min(scrollbarTrackHeight.value, Math.max(SCROLLBAR_MIN_THUMB_HEIGHT_PX, rawThumbHeight))
  })
  const scrollbarThumbTop = computed(() => {
    if (!showScrollbar.value) return SCROLLBAR_INSET_PX
    const maxScrollTop = Math.max(0, options.containerHeight.value - options.viewportHeight.value)
    const maxThumbTravel = Math.max(0, scrollbarTrackHeight.value - scrollbarThumbHeight.value)
    const progress = maxScrollTop > 0 ? clamp(options.scrollTop.value / maxScrollTop, 0, 1) : 0
    return SCROLLBAR_INSET_PX + maxThumbTravel * progress
  })

  return {
    getScrollbarThumbStyle: () => getVibeMasonryScrollbarThumbStyle(scrollbarThumbHeight.value, scrollbarThumbTop.value),
    showScrollbar,
  }
}

export function normalizeMasonryBottomLoadBufferPx(value: number | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0
}

function normalizeAutoScrollSpeed(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}
