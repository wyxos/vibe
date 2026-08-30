import { watch } from 'vue'

import { mediaStateKey } from '../core/mediaAsset'
import type { MediaPreviewState } from '../core/mediaPreview'
import type { VibeItem, VibeItemId } from '../types'

interface MasonryMediaVisibilityOptions {
  fullyVisibleIndices: () => readonly number[]
  items: () => readonly VibeItem[]
  mediaIndices: () => ReadonlyMap<VibeItemId, number>
  onFullyVisible: (postId: VibeItemId, mediaIndex: number) => void
  onVisible: (postId: VibeItemId, mediaIndex: number) => void
  previewStates: () => ReadonlyMap<string, MediaPreviewState>
  visibleIndices: () => readonly number[]
}

interface ReadyMedia {
  key: string
  mediaIndex: number
  postId: VibeItemId
}

export function useMasonryMediaVisibility(
  options: MasonryMediaVisibilityOptions,
): void {
  function readyMedia(indices: readonly number[]): ReadyMedia[] {
    return indices.flatMap((index) => {
      const item = options.items()[index]
      if (!item) return []
      const mediaIndex = options.mediaIndices().get(item.postId) ?? 0
      const key = mediaStateKey(item.postId, mediaIndex)
      return options.previewStates().get(key) === 'ready'
        ? [{ key, mediaIndex, postId: item.postId }]
        : []
    })
  }

  function watchEntries(
    indices: () => readonly number[],
    onEnter: (postId: VibeItemId, mediaIndex: number) => void,
  ): void {
    let previous = new Set<string>()
    watch(
      () => readyMedia(indices()),
      (entries) => {
        const next = new Set(entries.map(({ key }) => key))
        entries.forEach(({ key, mediaIndex, postId }) => {
          if (!previous.has(key)) onEnter(postId, mediaIndex)
        })
        previous = next
      },
      { immediate: true, flush: 'post' },
    )
  }

  watchEntries(options.visibleIndices, options.onVisible)
  watchEntries(options.fullyVisibleIndices, options.onFullyVisible)
}
