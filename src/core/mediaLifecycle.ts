import { isReactive, watch } from 'vue'

import { clampMediaIndex, mediaAssetAt } from './mediaAsset'
import { createMediaLifecycleIndex } from './mediaLifecycleIndex'
import type { VibeRuntimeState } from './runtime'
import type {
  VibeItemId,
  VibeLayout,
  VibeMediaLifecycleContext,
  VibeReelOrigin,
} from '../types'

const itemIndices = new WeakMap<VibeRuntimeState, ReturnType<typeof createMediaLifecycleIndex>>()

function postIndexFor(state: VibeRuntimeState, postId: VibeItemId): number {
  // Map uses SameValueZero; lifecycle identity historically uses strict equality.
  if (typeof postId === 'number' && Number.isNaN(postId)) return -1
  // Runtime items are reactive. Keep the standalone helper correct for plain
  // caller-owned state too, where in-place mutations cannot invalidate a cache.
  if (!isReactive(state) || !isReactive(state.items)) {
    return state.items.findIndex((item) => item.postId === postId)
  }
  let find = itemIndices.get(state)
  if (!find) {
    find = createMediaLifecycleIndex(state)
    itemIndices.set(state, find)
  }
  return find(postId)
}

export function mediaLifecycleContext(
  state: VibeRuntimeState,
  postId: VibeItemId,
  mediaIndex: number,
  layout: VibeLayout,
  origin: VibeReelOrigin | null,
): VibeMediaLifecycleContext | null {
  const postIndex = postIndexFor(state, postId)
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
