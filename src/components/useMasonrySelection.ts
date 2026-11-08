import { watch } from 'vue'
import type { VibeItem, VibeItemId } from '../types'
import { useSelectionContext } from './useSelectionContext'

export function useMasonrySelection(items: () => readonly VibeItem[], visibleIndices: () => readonly number[]) {
  const context = useSelectionContext()
  if (context) watch(() => visibleIndices().map(index => items()[index]?.postId)
    .filter((id): id is VibeItemId => id !== undefined), ids => { context.visibleIds.value = ids }, { immediate: true })
  return (event: MouseEvent) => {
    const controller = context?.controller
    if (!controller?.enabled || !controller.selectionOptions.clearOnBackgroundClick || !controller.state.count
      || event.defaultPrevented || event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
    const target = event.target
    if (!(target instanceof HTMLElement) || !target.matches('.masonry, .masonry-feed, .masonry-bottom-space')) return
    const feed = event.currentTarget
    if (!(feed instanceof HTMLElement)) return
    const bounds = feed.getBoundingClientRect()
    // Native scrollbar gutters belong to scrolling, even when the feed is the event target.
    if (event.clientX < bounds.left + feed.clientLeft || event.clientX >= bounds.left + feed.clientLeft + feed.clientWidth
      || event.clientY < bounds.top + feed.clientTop || event.clientY >= bounds.top + feed.clientTop + feed.clientHeight) return
    controller.clear()
  }
}
