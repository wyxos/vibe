import { watch } from 'vue'
import type { VibeItem, VibeItemId } from '../types'
import { useSelectionContext } from './useSelectionContext'

export function useMasonrySelection(items: () => readonly VibeItem[], visibleIndices: () => readonly number[]) {
  const context = useSelectionContext()
  if (context) watch(() => visibleIndices().map(index => items()[index]?.postId)
    .filter((id): id is VibeItemId => id !== undefined), ids => { context.visibleIds.value = ids }, { immediate: true })
}
