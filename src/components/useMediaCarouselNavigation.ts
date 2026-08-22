import { onBeforeUnmount, shallowRef } from 'vue'

import { mediaAssets } from '../core/mediaAsset'
import type { VibeItem, VibeLayout } from '../types'

interface MediaCarouselNavigationOptions {
  item: () => VibeItem
  layout: () => VibeLayout
  mediaIndex: () => number
  onChange: (mediaIndex: number) => void
}

const SWIPE_THRESHOLD = 40
const WHEEL_RESET_MS = 160
const WHEEL_THRESHOLD = 24

export function useMediaCarouselNavigation(options: MediaCarouselNavigationOptions) {
  const direction = shallowRef<'next' | 'previous'>('next')
  let wheelResetTimer: ReturnType<typeof setTimeout> | null = null
  let wheelDeltaX = 0
  let wheelGestureConsumed = false
  let touchStartX: number | null = null
  let touchStartY: number | null = null

  function change(index: number, event?: MouseEvent): void {
    const mediaCount = mediaAssets(options.item()).length
    const nextIndex = (index + mediaCount) % mediaCount
    if (nextIndex === options.mediaIndex()) return
    direction.value = index < options.mediaIndex() ? 'previous' : 'next'
    options.onChange(nextIndex)
    if (event?.detail && event.detail > 0) {
      (event.currentTarget as HTMLElement | null)?.blur()
    }
  }

  function resetWheelGesture(): void {
    wheelDeltaX = 0
    wheelGestureConsumed = false
    if (wheelResetTimer !== null) clearTimeout(wheelResetTimer)
    wheelResetTimer = null
  }

  function scheduleWheelReset(): void {
    if (wheelResetTimer !== null) clearTimeout(wheelResetTimer)
    wheelResetTimer = setTimeout(resetWheelGesture, WHEEL_RESET_MS)
  }

  function normalizeWheelDelta(delta: number, mode: number, pageSize: number): number {
    if (mode === 1) return delta * 16
    if (mode === 2) return delta * pageSize
    return delta
  }

  function onWheel(event: WheelEvent): void {
    if (mediaAssets(options.item()).length <= 1) return
    const target = event.currentTarget as HTMLElement | null
    const deltaX = normalizeWheelDelta(
      event.deltaX,
      event.deltaMode,
      target?.clientWidth || 1,
    )
    if (deltaX === 0) return
    event.preventDefault()
    scheduleWheelReset()
    if (wheelGestureConsumed) return
    wheelDeltaX += deltaX
    if (Math.abs(wheelDeltaX) < WHEEL_THRESHOLD) return
    const nextDirection = Math.sign(wheelDeltaX)
    wheelDeltaX = 0
    wheelGestureConsumed = true
    change(options.mediaIndex() + nextDirection)
  }

  function onTouchStart(event: TouchEvent): void {
    const touch = event.touches[0]
    if (options.layout() !== 'reel' || !touch) return
    touchStartX = touch.clientX
    touchStartY = touch.clientY
  }

  function onTouchEnd(event: TouchEvent): void {
    const touch = event.changedTouches[0]
    if (touchStartX === null || touchStartY === null || !touch) return
    const deltaX = touchStartX - touch.clientX
    const deltaY = touchStartY - touch.clientY
    touchStartX = null
    touchStartY = null
    if (Math.abs(deltaX) <= Math.abs(deltaY)) return
    if (Math.abs(deltaX) < SWIPE_THRESHOLD) return
    change(options.mediaIndex() + Math.sign(deltaX))
  }

  onBeforeUnmount(resetWheelGesture)

  return { change, direction, onTouchEnd, onTouchStart, onWheel }
}
