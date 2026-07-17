export interface ScrollbarGeometryOptions {
  contentSize: number
  minimumThumbSize: number
  scrollPosition: number
  trackSize: number
  viewportSize: number
}

export interface ScrollbarGeometry {
  maximumScrollPosition: number
  scrollable: boolean
  thumbOffset: number
  thumbSize: number
  thumbTravel: number
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}

export function calculateScrollbarGeometry({
  contentSize,
  minimumThumbSize,
  scrollPosition,
  trackSize,
  viewportSize,
}: ScrollbarGeometryOptions): ScrollbarGeometry {
  const safeContentSize = Math.max(0, contentSize)
  const safeTrackSize = Math.max(0, trackSize)
  const safeViewportSize = Math.max(0, viewportSize)
  const maximumScrollPosition = Math.max(0, safeContentSize - safeViewportSize)
  const scrollable = maximumScrollPosition > 0 && safeTrackSize > 0

  if (!scrollable) {
    return {
      maximumScrollPosition,
      scrollable: false,
      thumbOffset: 0,
      thumbSize: safeTrackSize,
      thumbTravel: 0,
    }
  }

  const thumbSize = clamp(
    safeTrackSize * (safeViewportSize / safeContentSize),
    Math.min(Math.max(0, minimumThumbSize), safeTrackSize),
    safeTrackSize,
  )
  const thumbTravel = Math.max(0, safeTrackSize - thumbSize)
  const scrollProgress = clamp(scrollPosition, 0, maximumScrollPosition)
    / maximumScrollPosition

  return {
    maximumScrollPosition,
    scrollable: true,
    thumbOffset: thumbTravel * scrollProgress,
    thumbSize,
    thumbTravel,
  }
}
