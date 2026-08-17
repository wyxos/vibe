import { computed, onBeforeUnmount, watch } from 'vue'

import {
  acquireVisiblePostPreload,
  visiblePostPreloadTargets,
} from '../core/visiblePostPreload'
import type {
  VibeItem,
  VibeLayout,
  VibeMediaCardOptions,
  VibeMediaSource,
} from '../types'

interface VisiblePostPreloadOptions {
  inViewport: () => boolean
  item: () => VibeItem
  layout: () => VibeLayout
  mediaCard: () => VibeMediaCardOptions | undefined
  mediaIndex: () => number
  mediaReady: () => boolean
  mediaSource: () => VibeMediaSource
}

export function useVisiblePostPreload(
  options: VisiblePostPreloadOptions,
): void {
  const enabled = computed(() => (
    options.layout() === 'masonry'
    && options.inViewport()
    && options.mediaReady()
    && options.mediaCard()?.feedPreload === 'visible-post'
  ))
  const targets = computed(() => enabled.value
    ? visiblePostPreloadTargets(
        options.item(),
        options.mediaIndex(),
        options.mediaSource(),
      )
    : [])
  const releases = new Map<string, () => void>()

  function reconcile(): void {
    const desired = new Map(targets.value.map((target) => [target.key, target]))
    releases.forEach((release, key) => {
      if (desired.has(key)) return
      release()
      releases.delete(key)
    })
    targets.value.forEach((target) => {
      if (!releases.has(target.key)) {
        releases.set(target.key, acquireVisiblePostPreload(target))
      }
    })
  }

  watch(
    () => targets.value.map(({ key }) => key).join('\n'),
    reconcile,
    { immediate: true },
  )

  onBeforeUnmount(() => {
    releases.forEach((release) => release())
    releases.clear()
  })
}
