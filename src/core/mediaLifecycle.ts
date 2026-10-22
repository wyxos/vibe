import { watch } from 'vue'

import { clampMediaIndex, mediaAssetAt } from './mediaAsset'
import type { VibeRuntimeState } from './runtime'
import type {
  VibeItemId,
  VibeLayout,
  VibeMediaLifecycleContext,
  VibeReelOrigin,
} from '../types'

export function mediaLifecycleContext(
  state: VibeRuntimeState,
  postId: VibeItemId,
  mediaIndex: number,
  layout: VibeLayout,
  origin: VibeReelOrigin | null,
): VibeMediaLifecycleContext | null {
  const postIndex = state.items.findIndex((item) => item.postId === postId)
  const item = state.items[postIndex]
  if (!item) return null

  const normalizedMediaIndex = clampMediaIndex(item, mediaIndex)
  const media = mediaAssetAt(item, normalizedMediaIndex)
  return {
    item,
    layout,
    media,
    mediaId: media.mediaId ?? null,
    mediaIndex: normalizedMediaIndex,
    origin,
    phoneMode: state.phoneMode,
    postId: item.postId,
    postIndex,
  }
}

export function useReelMediaChangeLifecycle(
  state: VibeRuntimeState,
  onChange: (context: VibeMediaLifecycleContext) => void,
): void {
  watch(
    () => {
      const active = state.layout === 'reel' || state.reelOrigin === 'masonry'
      const postId = active ? state.activeReelPostId : null
      return {
        mediaIndex: postId === null ? 0 : state.mediaIndices.get(postId) ?? 0,
        origin: state.reelOrigin ?? ('reel' as const),
        postId,
      }
    },
    (current, previous) => {
      if (current.postId === null) return
      if (
        current.postId === previous?.postId
        && current.mediaIndex === previous.mediaIndex
        && current.origin === previous.origin
      ) return

      const context = mediaLifecycleContext(
        state,
        current.postId,
        current.mediaIndex,
        'reel',
        current.origin,
      )
      if (context) onChange(context)
    },
    { flush: 'sync' },
  )
}
