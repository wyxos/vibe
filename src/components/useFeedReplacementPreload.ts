import { computed, onBeforeUnmount, watch } from 'vue'

import {
  preloadFeedVariant,
  replacementFeedVariant,
} from '../core/feedReplacementPreload'
import type {
  VibeItem,
  VibeLayout,
  VibeMediaCardOptions,
  VibeMediaSource,
} from '../types'

interface FeedReplacementPreloadOptions {
  item: () => VibeItem
  layout: () => VibeLayout
  mediaCard: () => VibeMediaCardOptions | undefined
  mediaIndex: () => number
  mediaReady: () => boolean
  mediaSource: () => VibeMediaSource
}

export function useFeedReplacementPreload(
  options: FeedReplacementPreloadOptions,
): void {
  const enabled = computed(() => (
    options.layout() === 'masonry'
    && options.mediaCard()?.feedPreload === 'replacement'
  ))
  const target = computed(() => {
    if (!enabled.value || !options.mediaReady()) return null

    return replacementFeedVariant(
      options.item(),
      options.mediaIndex(),
      options.mediaSource(),
    )
  })
  let dispose: (() => void) | null = null

  watch(
    [
      enabled,
      () => options.mediaReady(),
      () => target.value && `${target.value.type ?? ''}:${target.value.src}`,
    ],
    ([isEnabled, isReady]) => {
      if (isEnabled && !isReady) return
      dispose?.()
      dispose = isEnabled && target.value
        ? preloadFeedVariant(target.value)
        : null
    },
    { immediate: true },
  )

  onBeforeUnmount(() => dispose?.())
}
