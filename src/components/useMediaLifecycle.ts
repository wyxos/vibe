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
  fullyVisible: (context: VibeMediaLifecycleContext) => void
  ready: (context: VibeMediaLifecycleContext) => void
  reelChange: (context: VibeMediaLifecycleContext) => void
  visible: (context: VibeMediaLifecycleContext) => void
}

export function useMediaLifecycle(state: VibeRuntimeState, events: MediaLifecycleEvents) {
  const fullyVisibleMedia = new Set<string>()
  const previewStates = shallowRef<ReadonlyMap<string, MediaPreviewState>>(new Map())
  const originalStates = shallowRef<ReadonlyMap<string, MediaPreviewState>>(new Map())
  const mobileStates = shallowRef<ReadonlyMap<string, MediaPreviewState>>(new Map())
  const reelStateTarget = () => {
    if (state.reelMediaSource === 'preview') return previewStates
    if (state.reelMediaSource === 'mobile') return mobileStates
    return originalStates
  }
  const reelStates = computed(() => reelStateTarget().value)
  const visibleMedia = new Set<string>()

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
    setState(reelStateTarget(), postId, mediaIndex, 'error')
  }

  function markReelReady(postId: VibeItemId, mediaIndex: number): void {
    setState(reelStateTarget(), postId, mediaIndex, 'ready')
    emitReady(postId, mediaIndex, 'reel', state.reelOrigin ?? 'reel')
  }

  function markMasonryVisible(postId: VibeItemId, mediaIndex: number): void {
    const key = mediaStateKey(postId, mediaIndex)
    if (visibleMedia.has(key)) return
    const value = context(postId, mediaIndex, 'masonry', null)
    if (!value) return
    visibleMedia.add(key)
    events.visible(value)
  }

  function emitFullyVisible(
    postId: VibeItemId,
    mediaIndex: number,
    layout: VibeLayout,
    origin: VibeReelOrigin | null,
  ): void {
    const key = [layout, mediaStateKey(postId, mediaIndex)].join(':')
    if (fullyVisibleMedia.has(key)) return
    const value = context(postId, mediaIndex, layout, origin)
    if (!value) return
    fullyVisibleMedia.add(key)
    events.fullyVisible(value)
  }

  function markMasonryFullyVisible(postId: VibeItemId, mediaIndex: number): void {
    emitFullyVisible(postId, mediaIndex, 'masonry', null)
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
      emitFullyVisible(current.postId, current.mediaIndex, 'reel', current.origin)
    },
    { flush: 'post' },
  )

  return {
    markMasonryFullyVisible,
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
