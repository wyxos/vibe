import { computed, shallowRef, watch } from 'vue'

import { mediaStateKey } from '../core/mediaAsset'
import { mediaLifecycleContext, useReelMediaChangeLifecycle } from '../core/mediaLifecycle'
import type { MediaPreviewState } from '../core/mediaPreview'
import type { VibeRuntimeState } from '../core/runtime'
import type {
  VibeItemId,
  VibeLayout,
  VibeMediaLifecycleContext,
  VibeReelOrigin,
} from '../types'

interface MediaLifecycleEvents {
  ready: (context: VibeMediaLifecycleContext) => void
  reelChange: (context: VibeMediaLifecycleContext) => void
  visible: (context: VibeMediaLifecycleContext) => void
}

export function useMediaLifecycle(state: VibeRuntimeState, events: MediaLifecycleEvents) {
  const previewStates = shallowRef<ReadonlyMap<string, MediaPreviewState>>(new Map())
  const originalStates = shallowRef<ReadonlyMap<string, MediaPreviewState>>(new Map())
  const reelStates = computed(() => state.reelMediaSource === 'original'
    ? originalStates.value
    : previewStates.value)

  function setState(
    target: typeof previewStates,
    postId: VibeItemId,
    mediaIndex: number,
    value: MediaPreviewState,
  ): void {
    const key = mediaStateKey(postId, mediaIndex)
    if (target.value.get(key) !== value) target.value = new Map(target.value).set(key, value)
  }

  function context(
    postId: VibeItemId,
    mediaIndex: number,
    layout: VibeLayout,
    origin: VibeReelOrigin | null,
  ): VibeMediaLifecycleContext | null {
    return mediaLifecycleContext(state, postId, mediaIndex, layout, origin)
  }

  function emitReady(
    postId: VibeItemId,
    mediaIndex: number,
    layout: VibeLayout,
    origin: VibeReelOrigin | null,
  ): void {
    const value = context(postId, mediaIndex, layout, origin)
    if (value) events.ready(value)
  }

  function markPreviewError(postId: VibeItemId, mediaIndex: number): void {
    setState(previewStates, postId, mediaIndex, 'error')
  }

  function markPreviewReady(postId: VibeItemId, mediaIndex: number): void {
    setState(previewStates, postId, mediaIndex, 'ready')
    emitReady(postId, mediaIndex, 'masonry', null)
  }

  function markReelError(postId: VibeItemId, mediaIndex: number): void {
    setState(
      state.reelMediaSource === 'original' ? originalStates : previewStates,
      postId,
      mediaIndex,
      'error',
    )
  }

  function markReelReady(postId: VibeItemId, mediaIndex: number): void {
    setState(
      state.reelMediaSource === 'original' ? originalStates : previewStates,
      postId,
      mediaIndex,
      'ready',
    )
    emitReady(postId, mediaIndex, 'reel', state.reelOrigin ?? 'reel')
  }

  function markMasonryVisible(postId: VibeItemId, mediaIndex: number): void {
    const value = context(postId, mediaIndex, 'masonry', null)
    if (value) events.visible(value)
  }

  useReelMediaChangeLifecycle(state, events.reelChange)
  watch(
    () => {
      const active = state.layout === 'reel' || state.reelOrigin === 'masonry'
      const postId = active ? state.activeReelPostId : null
      const mediaIndex = postId === null ? 0 : state.mediaIndices.get(postId) ?? 0
      return {
        mediaIndex,
        origin: state.reelOrigin ?? ('reel' as const),
        postId,
        ready: postId !== null
          && reelStates.value.get(mediaStateKey(postId, mediaIndex)) === 'ready',
      }
    },
    (current, previous) => {
      if (current.postId === null || !current.ready) return
      if (previous?.ready && previous.postId === current.postId
        && previous.mediaIndex === current.mediaIndex
        && previous.origin === current.origin) return
      const value = context(current.postId, current.mediaIndex, 'reel', current.origin)
      if (value) events.visible(value)
    },
    { flush: 'post' },
  )

  return {
    markMasonryVisible,
    markPreviewError,
    markPreviewReady,
    markReelError,
    markReelReady,
    originalStates,
    previewStates,
    reelStates,
  }
}
