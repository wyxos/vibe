import { nextTick, type Ref } from 'vue'
import type { VibeViewerItem } from '../viewer'
import type { VibeAutoBucket } from './autoBuckets'

export interface EmptyVisiblePrefetchOptions {
  canRefreshTrailingBoundary: Readonly<Ref<boolean>>
  hasNextPage: Readonly<Ref<boolean>>
  isInitialLoading: () => boolean
  isPageLoadingLocked: Readonly<Ref<boolean>>
  items: Readonly<Ref<VibeViewerItem[]>>
  loading: Readonly<Ref<boolean>>
  prefetchNextPage: () => Promise<void>
  removedIds: Readonly<Ref<Set<string>>>
  trailingBoundaryBucket: Readonly<Ref<VibeAutoBucket | null>>
}

export function createEmptyVisiblePrefetchScheduler(options: EmptyVisiblePrefetchOptions) {
  let refreshAttemptKey: string | null = null
  let resolving = false
  let scheduled = false

  function resetRefreshAttempt() {
    refreshAttemptKey = null
  }

  function schedule() {
    if (scheduled || resolving) {
      return
    }

    scheduled = true
    void nextTick().then(resolve)
  }

  async function resolve() {
    scheduled = false

    if (!shouldPrefetch()) {
      return
    }

    if (!options.hasNextPage.value) {
      const nextRefreshAttemptKey = getRefreshAttemptKey()

      if (refreshAttemptKey === nextRefreshAttemptKey) {
        return
      }

      refreshAttemptKey = nextRefreshAttemptKey
    }

    resolving = true
    try {
      await options.prefetchNextPage()
    }
    finally {
      resolving = false
      if (shouldPrefetch()) {
        schedule()
      }
    }
  }

  function shouldPrefetch() {
    return !options.items.value.length
      && !options.loading.value
      && !options.isInitialLoading()
      && !options.isPageLoadingLocked.value
      && (options.hasNextPage.value || options.canRefreshTrailingBoundary.value)
  }

  function getRefreshAttemptKey() {
    const bucket = options.trailingBoundaryBucket.value

    return [
      bucket?.cursor ?? '',
      bucket?.nextCursor ?? '',
      bucket?.items.map((item) => item.id).join('\u001f') ?? '',
      options.removedIds.value.size,
    ].join('\u001e')
  }

  return {
    resetRefreshAttempt,
    schedule,
  }
}
