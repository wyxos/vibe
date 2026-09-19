import {
  computed,
  onBeforeUnmount,
  shallowRef,
  type ComputedRef,
  type Ref,
} from 'vue'

import type { MasonryFeedProps } from '../core/feed'
import {
  calculateMasonryLayout,
  continueMasonryLayout,
  type MasonryLayout,
} from '../core/masonry'
import {
  continueMasonryViewportIndex,
  createMasonryViewportIndex,
  type MasonryViewportIndex,
} from '../core/masonryViewportIndex'

const TAIL_PACK_CHUNK = 1_500

export function useSettledMasonryFeedLayout(options: {
  additionalHeight: ComputedRef<number>
  gap: Ref<number>
  items: () => MasonryFeedProps['items']
  minColumnWidth: ComputedRef<number>
  packThroughIndex: () => number
  packUntilBottom: () => number
  width: Ref<number>
}) {
  const epoch = shallowRef(0)
  let additionalHeight = 0
  let cache: MasonryLayout | null = null
  let gap = 0
  let minColumnWidth = 0
  let packFrame: number | null = null
  let reservedHeight = 0
  let source: MasonryFeedProps['items'] | null = null
  let viewportIndex: MasonryViewportIndex | null = null
  let width = 0

  function cancelPack(): void {
    if (packFrame === null) return
    cancelAnimationFrame(packFrame)
    packFrame = null
  }

  function commitLayout(
    layout: MasonryLayout,
    media: MasonryFeedProps['items'],
    fromIndex: number,
    previous: MasonryLayout,
  ): MasonryLayout {
    cache = layout
    source = media
    viewportIndex = continueMasonryViewportIndex(
      layout.items,
      viewportIndex ?? createMasonryViewportIndex(previous.items),
      fromIndex,
    )
    reservedHeight = layout.items.length < media.length
      ? Math.max(reservedHeight, previous.height, layout.height)
      : 0
    if (layout.items.length < media.length && layout.items.length > fromIndex) {
      scheduleTailPack()
    }
    return layout
  }

  function scheduleTailPack(): void {
    if (packFrame !== null) return
    packFrame = requestAnimationFrame(() => {
      packFrame = null
      const media = options.items()
      const previous = cache
      if (!previous || previous.items.length >= media.length) return
      const fromIndex = previous.items.length
      commitLayout(
        continueMasonryLayout(
          media,
          options.width.value,
          {
            additionalHeight: options.additionalHeight.value,
            gap: options.gap.value,
            minColumnWidth: options.minColumnWidth.value,
          },
          previous,
          fromIndex,
          {
            throughIndex: options.packThroughIndex(),
            untilIndex: fromIndex + TAIL_PACK_CHUNK,
          },
        ),
        media,
        fromIndex,
        previous,
      )
      epoch.value += 1
    })
  }

  const layout = computed(() => {
    void epoch.value
    const media = options.items()
    const nextWidth = options.width.value
    const nextOptions = {
      additionalHeight: options.additionalHeight.value,
      gap: options.gap.value,
      minColumnWidth: options.minColumnWidth.value,
    }
    const cached = cache
    if (
      cached
      && source
      && width === nextWidth
      && gap === nextOptions.gap
      && additionalHeight === nextOptions.additionalHeight
      && minColumnWidth === nextOptions.minColumnWidth
    ) {
      let fromIndex = 0
      const previousItems = source
      const limit = Math.min(previousItems.length, media.length)
      while (fromIndex < limit && previousItems[fromIndex] === media[fromIndex]) {
        fromIndex += 1
      }
      if (fromIndex === media.length && fromIndex === previousItems.length) {
        if (cached.items.length > 0 && cached.items.length < media.length) {
          scheduleTailPack()
        }
        return cached
      }
      cancelPack()
      return commitLayout(
        continueMasonryLayout(
          media,
          nextWidth,
          nextOptions,
          cached,
          fromIndex,
          {
            throughIndex: options.packThroughIndex(),
            untilBottom: options.packUntilBottom(),
          },
        ),
        media,
        fromIndex,
        cached,
      )
    }

    cancelPack()
    const next = calculateMasonryLayout(media, nextWidth, nextOptions)
    cache = next
    source = media
    width = nextWidth
    gap = nextOptions.gap
    additionalHeight = nextOptions.additionalHeight
    minColumnWidth = nextOptions.minColumnWidth
    viewportIndex = createMasonryViewportIndex(next.items)
    reservedHeight = 0
    return next
  })

  const viewport = computed(() => {
    void layout.value
    return viewportIndex ?? createMasonryViewportIndex(layout.value.items)
  })

  onBeforeUnmount(cancelPack)

  return {
    ensurePackedThrough(bottom: number): void {
      const media = options.items()
      const previous = cache
      if (!previous || previous.items.length >= media.length) return
      if (previous.height >= bottom) return
      cancelPack()
      const fromIndex = previous.items.length
      commitLayout(
        continueMasonryLayout(
          media,
          options.width.value,
          {
            additionalHeight: options.additionalHeight.value,
            gap: options.gap.value,
            minColumnWidth: options.minColumnWidth.value,
          },
          previous,
          fromIndex,
          {
            throughIndex: options.packThroughIndex(),
            untilBottom: bottom,
          },
        ),
        media,
        fromIndex,
        previous,
      )
      epoch.value += 1
    },
    layout,
    reservedHeight: () => reservedHeight,
    viewportIndex: viewport,
  }
}
