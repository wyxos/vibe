import { nextTick, ref, type Ref } from 'vue'
import type { VibeViewerItem } from '../viewer'
import { buildMasonryLayout, estimateMasonryAppendContentHeight } from './masonryLayout'

export function useMasonryPendingAppend(options: {
  bucketPx: number
  columnHeights: Ref<number[]>
  columnCount: Ref<number>
  columnWidth: Ref<number>
  commitPendingAppend: Ref<(() => void | Promise<void>) | null | undefined>
  contentHeight: Ref<number>
  contentInsetPx: number
  gapPx: number
  items: Ref<VibeViewerItem[]>
  pendingAppendItems: Ref<VibeViewerItem[]>
}) {
  const reservedContentHeight = ref<number | null>(null)
  const isSettlingReservedHeight = ref(false)
  let appendCommitTimer: ReturnType<typeof setTimeout> | null = null

  function refreshReservedContentHeight() {
    clearAppendCommitTimer()
    if (!options.pendingAppendItems.value.length) return
    reservedContentHeight.value = measureContentHeight([...options.items.value, ...options.pendingAppendItems.value])
    schedulePendingAppendCommit()
  }

  function clearReservedHeightWhenIdle(isLoading: boolean) {
    if (!isLoading && !options.pendingAppendItems.value.length && !appendCommitTimer && !isSettlingReservedHeight.value) {
      reservedContentHeight.value = null
    }
  }

  function clearAppendCommitTimer() {
    if (!appendCommitTimer) return
    clearTimeout(appendCommitTimer)
    appendCommitTimer = null
  }

  function schedulePendingAppendCommit() {
    const commitPendingAppend = options.commitPendingAppend.value
    if (typeof commitPendingAppend !== 'function') return
    appendCommitTimer = setTimeout(async () => {
      appendCommitTimer = null
      isSettlingReservedHeight.value = true
      try {
        if (options.pendingAppendItems.value.length) {
          await commitPendingAppend()
          await nextTick()
          await nextTick()
        }
      }
      finally {
        reservedContentHeight.value = null
        isSettlingReservedHeight.value = false
      }
    }, 300)
  }

  function measureContentHeight(items: VibeViewerItem[]) {
    if (!items.length) return 0
    if (options.pendingAppendItems.value.length && options.columnHeights.value.length === options.columnCount.value) {
      return estimateMasonryAppendContentHeight(options.pendingAppendItems.value, {
        columnHeights: options.columnHeights.value,
        columnWidth: options.columnWidth.value,
        contentHeight: options.contentHeight.value,
        gapY: options.gapPx,
      }) + options.contentInsetPx * 2
    }

    const projectedLayout = buildMasonryLayout(items, {
      bucketPx: options.bucketPx,
      columnCount: options.columnCount.value,
      columnWidth: options.columnWidth.value,
      gapX: options.gapPx,
      gapY: options.gapPx,
    })

    return projectedLayout.contentHeight + options.contentInsetPx * 2
  }

  return {
    clearAppendCommitTimer,
    clearReservedHeightWhenIdle,
    refreshReservedContentHeight,
    reservedContentHeight,
  }
}
