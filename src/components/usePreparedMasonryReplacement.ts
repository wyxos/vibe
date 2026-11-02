import { computed, onBeforeUnmount, shallowRef, watch, type CSSProperties } from 'vue'
import type { MasonryFeedProps } from '../core/feed'
import type { MediaFailure } from '../core/mediaFailure'
import { mediaAssetAt, mediaStateKey, mediaVariantForSource } from '../core/mediaAsset'
import { calculateMasonryLayout, calculateVisibleMasonryIndices, continueMasonryLayout } from '../core/masonry'
import type { MediaPreviewState } from '../core/mediaPreview'
import { resolveMediaType } from '../core/mediaType'
import type { VibeItem, VibeItemId } from '../types'

interface PreparationGeometry {
  width: () => number
  viewportHeight: () => number
  scrollTop: () => number
  contentTop: () => number
  overscan: () => number
  layoutOptions: () => { additionalHeight: number, gap: number, minColumnWidth: number }
}
interface PreparationEvents {
  ready: (postId: VibeItemId, index: number) => void
  error: (postId: VibeItemId, index: number) => void
  failure: (postId: VibeItemId, failure: MediaFailure) => void
}
interface PendingMedia {
  postId: VibeItemId
  index: number
  state: MediaPreviewState
  failure?: MediaFailure
}

/** Keep staged cards in the feed's keyed list so promotion retains native decoders. */
export function usePreparedMasonryReplacement(
  props: MasonryFeedProps, geometry: PreparationGeometry, events: PreparationEvents,
) {
  const incoming = shallowRef<readonly VibeItem[]>([])
  const resetScroll = shallowRef(false)
  let retainedIds = new Set<VibeItemId>()
  const pending = shallowRef<ReadonlyMap<string, PendingMedia>>(new Map())
  const currentIds = computed(() => new Set(props.items.map(item => item.postId)))
  const stagedIds = computed(() => new Set(incoming.value.map(item => item.postId)
    .filter(id => !currentIds.value.has(id))))
  const rows = computed(() => {
    const items = incoming.value
    if (!items.length || geometry.width() <= 0) return []
    const top = resetScroll.value ? 0 : geometry.scrollTop() - geometry.contentTop()
    const bottom = top + geometry.viewportHeight() + geometry.overscan()
    const options = geometry.layoutOptions()
    const first = calculateMasonryLayout(items.slice(0, 1), geometry.width(), options)
    const layout = continueMasonryLayout(items, geometry.width(), options, first, 1, { untilBottom: bottom })
    return calculateVisibleMasonryIndices(layout.items, {
      scrollTop: top, viewportHeight: geometry.viewportHeight(), overscan: geometry.overscan(),
    }).flatMap(index => {
      const item = items[index]!
      const asset = mediaAssetAt(item, props.mediaIndices.get(item.postId) ?? 0)
      const variant = mediaVariantForSource(asset, 'preview')
      if (retainedIds.has(item.postId) || resolveMediaType(variant.type, variant.src) !== 'video') return []
      const position = layout.items[index]!
      const preparedStyle: CSSProperties = {
        width: `${position.width}px`, height: `${position.height}px`,
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        visibility: 'hidden', pointerEvents: 'none', transition: 'none',
      }
      return [{ item, index, fetchPriority: 'high' as const, preparing: !currentIds.value.has(item.postId), preparedStyle }]
    })
  })
  function cancelItemReplacement() {
    incoming.value = []
    pending.value = new Map()
  }
  function prepareItemReplacement(items: readonly VibeItem[], reset: boolean) {
    if (props.suspended) return
    cancelItemReplacement()
    retainedIds = new Set(props.items.map(item => item.postId))
    resetScroll.value = reset
    incoming.value = items
  }
  function record(postId: VibeItemId, index: number, state: MediaPreviewState, failure?: MediaFailure) {
    if (!stagedIds.value.has(postId)) {
      if (failure) events.failure(postId, failure)
      else if (state === 'ready') events.ready(postId, index)
      else events.error(postId, index)
      return
    }
    const key = mediaStateKey(postId, index)
    const previous = pending.value.get(key)
    pending.value = new Map(pending.value).set(key, { postId, index, state, failure: failure ?? previous?.failure })
  }
  watch(() => props.items, () => {
    // State is committed before replaying public lifecycle events. Retain the
    // private state through this DOM flush so cached metadata cannot leave a loader.
    for (const event of pending.value.values()) {
      if (!currentIds.value.has(event.postId)) continue
      if (event.state === 'ready') events.ready(event.postId, event.index)
      else events.error(event.postId, event.index)
      if (event.failure) events.failure(event.postId, event.failure)
    }
  }, { flush: 'post' })
  onBeforeUnmount(cancelItemReplacement)
  return {
    rows, prepareItemReplacement, cancelItemReplacement,
    previewState: (postId: VibeItemId, index: number) => pending.value.get(mediaStateKey(postId, index))?.state
      ?? props.previewStates.get(mediaStateKey(postId, index)) ?? 'loading',
    ready: (postId: VibeItemId, index: number) => record(postId, index, 'ready'),
    error: (postId: VibeItemId, index: number) => record(postId, index, 'error'),
    failure: (postId: VibeItemId, failure: MediaFailure) => record(postId, failure.mediaIndex, 'error', failure),
  }
}
