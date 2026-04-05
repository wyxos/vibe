import type { CSSProperties } from 'vue'

import type { VibeViewerItem } from '../vibeViewer'

export interface VibeRenderedRange {
  start: number
  end: number
}

export interface VibeRenderedItem {
  item: VibeViewerItem
  index: number
}

export const VIBE_WINDOW_OVERSCAN = 2

export function getRenderedRange(activeIndex: number, totalItems: number, overscan = VIBE_WINDOW_OVERSCAN): VibeRenderedRange {
  if (totalItems <= 0) {
    return {
      start: 0,
      end: -1,
    }
  }

  return {
    start: Math.max(0, activeIndex - overscan),
    end: Math.min(totalItems - 1, activeIndex + overscan),
  }
}

export function getRenderedItems(items: VibeViewerItem[], activeIndex: number, overscan = VIBE_WINDOW_OVERSCAN): VibeRenderedItem[] {
  const range = getRenderedRange(activeIndex, items.length, overscan)

  if (range.end < range.start) {
    return []
  }

  return items.slice(range.start, range.end + 1).map((item, offset) => ({
    item,
    index: range.start + offset,
  }))
}

export function getVirtualSlideStyle(
  index: number,
  activeIndex: number,
  viewportHeight: number,
  dragOffset: number,
  isDragging: boolean,
): CSSProperties {
  return {
    transform: `translate3d(0, ${(index - activeIndex) * viewportHeight + dragOffset}px, 0)`,
    transition: isDragging ? 'none' : 'transform 320ms cubic-bezier(0.22, 1, 0.36, 1)',
  }
}
