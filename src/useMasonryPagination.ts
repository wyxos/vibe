import { ref, type Ref } from 'vue'
import { normalizeError } from './utils/errorHandler'

export interface UseMasonryPaginationOptions {
  getPage: (page: any) => Promise<{ items: any[]; nextPage: any }>
  masonry: Ref<any[]>
  isLoading: Ref<boolean>
  hasReachedEnd: Ref<boolean>
  loadError: Ref<Error | null>
  currentPage: Ref<any>
  paginationHistory: Ref<any[]>
  refreshLayout: (items: any[]) => void
  retryMaxAttempts: number
  retryInitialDelayMs: number
  retryBackoffStepMs: number
  mode: string
  backfillDelayMs: number
  backfillMaxCalls: number
  pageSize: number
  autoRefreshOnEmpty: boolean
  emits: {
    (event: 'loading:start'): void
    (event: 'retry:start', payload: { attempt: number; max: number; totalMs: number }): void
    (event: 'retry:tick', payload: { attempt: number; remainingMs: number; totalMs: number }): void
    (event: 'retry:stop', payload: { attempt: number; success: boolean }): void
    (event: 'backfill:start', payload: { target: number; fetched: number; calls: number }): void
    (event: 'backfill:tick', payload: { fetched: number; target: number; calls: number; remainingMs: number; totalMs: number }): void
    (event: 'backfill:stop', payload: { fetched: number; calls: number; cancelled?: boolean }): void
    (event: 'loading:stop', payload: { fetched: number }): void
  }
}

export function useMasonryPagination(options: UseMasonryPaginationOptions) {
  const {
    getPage,
    masonry,
    isLoading,
    hasReachedEnd,
    loadError,
    currentPage,
    paginationHistory,
    refreshLayout,
    retryMaxAttempts,
    retryInitialDelayMs,
    retryBackoffStepMs,
    mode,
    backfillDelayMs,
    backfillMaxCalls,
    pageSize,
    autoRefreshOnEmpty,
    emits
  } = options

  const cancelRequested = ref(false)
  let backfillActive = false

  // Helper function to count items for a specific page
  function countItemsForPage(page: any): number {
    return masonry.value.filter((item: any) => item.page === page).length
  }

  // Helper function to check if an item already exists in masonry
  function itemExists(item: any, itemsArray?: any[]): boolean {
    if (!item || item.id == null || item.page == null) return false
    const itemsToCheck = itemsArray || masonry.value
    return itemsToCheck.some((existing: any) => {
      return existing && existing.id === item.id && existing.page === item.page
    })
  }

  // Helper function to get only new items from a response
  function getNewItems(responseItems: any[]): any[] {
    if (!responseItems || responseItems.length === 0) return []
    // Create a snapshot of current masonry items to avoid reactivity issues
    const currentItems = [...masonry.value]
    return responseItems.filter((item: any) => {
      if (!item || item.id == null || item.page == null) return false
      // Check if item exists by comparing id and page
      const exists = currentItems.some((existing: any) => {
        return existing && existing.id === item.id && existing.page === item.page
      })
      return !exists
    })
  }

  function waitWithProgress(totalMs: number, onTick: (remaining: number, total: number) => void) {
    return new Promise<void>((resolve) => {
      const total = Math.max(0, totalMs | 0)
      const start = Date.now()
      onTick(total, total)
      const id = setInterval(() => {
        // Check for cancellation
        if (cancelRequested.value) {
          clearInterval(id)
          resolve()
          return
        }
        const elapsed = Date.now() - start
        const remaining = Math.max(0, total - elapsed)
        onTick(remaining, total)
        if (remaining <= 0) {
          clearInterval(id)
          resolve()
        }
      }, 100)
    })
  }

  async function fetchWithRetry<T = any>(fn: () => Promise<T>): Promise<T> {
    let attempt = 0
    const max = retryMaxAttempts
    let delay = retryInitialDelayMs
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        const res = await fn()
        if (attempt > 0) {
          emits('retry:stop', { attempt, success: true })
        }
        return res
      } catch (err) {
        attempt++
        if (attempt > max) {
          emits('retry:stop', { attempt: attempt - 1, success: false })
          throw err
        }
        emits('retry:start', { attempt, max, totalMs: delay })
        await waitWithProgress(delay, (remaining, total) => {
          emits('retry:tick', { attempt, remainingMs: remaining, totalMs: total })
        })
        delay += retryBackoffStepMs
      }
    }
  }

  async function getContent(page: number) {
    try {
      const response = await fetchWithRetry(() => getPage(page))
      refreshLayout([...masonry.value, ...response.items])
      return response
    } catch (error) {
      // Error is handled by callers (loadPage, loadNext, etc.) which set loadError
      throw error
    }
  }

  async function maybeBackfillToTarget(baselineCount: number, force = false) {
    if (!force && mode !== 'backfill') return
    if (backfillActive) return
    if (cancelRequested.value) return
    // Don't backfill if we've reached the end
    if (hasReachedEnd.value) return

    const targetCount = (baselineCount || 0) + (pageSize || 0)
    if (!pageSize || pageSize <= 0) return

    const lastNext = paginationHistory.value[paginationHistory.value.length - 1]
    if (lastNext == null) {
      hasReachedEnd.value = true
      return
    }

    if (masonry.value.length >= targetCount) return

    backfillActive = true
    // Set loading to true at the start of backfill and keep it true throughout
    if (!isLoading.value) {
      isLoading.value = true
      emits('loading:start')
    }
    try {
      let calls = 0
      emits('backfill:start', { target: targetCount, fetched: masonry.value.length, calls })

      while (
        masonry.value.length < targetCount &&
        calls < backfillMaxCalls &&
        paginationHistory.value[paginationHistory.value.length - 1] != null &&
        !cancelRequested.value &&
        !hasReachedEnd.value &&
        backfillActive
      ) {
        await waitWithProgress(backfillDelayMs, (remaining, total) => {
          emits('backfill:tick', {
            fetched: masonry.value.length,
            target: targetCount,
            calls,
            remainingMs: remaining,
            totalMs: total
          })
        })

        if (cancelRequested.value || !backfillActive) break

        const currentPage = paginationHistory.value[paginationHistory.value.length - 1]
        if (currentPage == null) {
          hasReachedEnd.value = true
          break
        }
        try {
          // Don't toggle isLoading here - keep it true throughout backfill
          // Check cancellation before starting getContent to avoid unnecessary requests
          if (cancelRequested.value || !backfillActive) break
          const response = await getContent(currentPage)
          if (cancelRequested.value || !backfillActive) break
          // Clear error on successful load
          loadError.value = null
          paginationHistory.value.push(response.nextPage)
          // Update hasReachedEnd if nextPage is null
          if (response.nextPage == null) {
            hasReachedEnd.value = true
          }
        } catch (error) {
          // Set load error but don't break the backfill loop unless cancelled
          if (cancelRequested.value || !backfillActive) break
          loadError.value = normalizeError(error)
        }

        calls++
      }

      emits('backfill:stop', { fetched: masonry.value.length, calls })
    } finally {
      backfillActive = false
      // Only set loading to false when backfill completes or is cancelled
      isLoading.value = false
      emits('loading:stop', { fetched: masonry.value.length })
    }
  }

  async function loadPage(page: number) {
    if (isLoading.value) return
    // Starting a new load should clear any previous cancel request
    cancelRequested.value = false
    if (!isLoading.value) {
      isLoading.value = true
      emits('loading:start')
    }
    // Reset hasReachedEnd and loadError when loading a new page
    hasReachedEnd.value = false
    loadError.value = null
    try {
      const baseline = masonry.value.length
      if (cancelRequested.value) return
      const response = await getContent(page)
      if (cancelRequested.value) return
      // Clear error on successful load
      loadError.value = null
      currentPage.value = page  // Track the current page
      paginationHistory.value.push(response.nextPage)
      // Update hasReachedEnd if nextPage is null
      if (response.nextPage == null) {
        hasReachedEnd.value = true
      }
      await maybeBackfillToTarget(baseline)
      return response
    } catch (error) {
      // Set load error - error is handled and exposed to UI via loadError
      loadError.value = normalizeError(error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  async function loadNext() {
    if (isLoading.value) return
    // Don't load if we've already reached the end
    if (hasReachedEnd.value) return
    // Starting a new load should clear any previous cancel request
    cancelRequested.value = false
    if (!isLoading.value) {
      isLoading.value = true
      emits('loading:start')
    }
    // Clear error when attempting to load
    loadError.value = null
    try {
      const baseline = masonry.value.length
      if (cancelRequested.value) return

      // Refresh mode: check if current page needs refreshing before loading next
      if (mode === 'refresh' && currentPage.value != null) {
        const currentPageItemCount = countItemsForPage(currentPage.value)

        // If current page has fewer items than pageSize, refresh it first
        if (currentPageItemCount < pageSize) {
          const response = await fetchWithRetry(() => getPage(currentPage.value))
          if (cancelRequested.value) return

          // Get only new items that don't already exist
          // We need to check against the current masonry state at this moment
          const currentMasonrySnapshot = [...masonry.value]
          const newItems = response.items.filter((item: any) => {
            if (!item || item.id == null || item.page == null) return false
            return !currentMasonrySnapshot.some((existing: any) => {
              return existing && existing.id === item.id && existing.page === item.page
            })
          })

          // Append only new items to masonry (same pattern as getContent)
          if (newItems.length > 0) {
            const updatedItems = [...masonry.value, ...newItems]
            refreshLayout(updatedItems)
            // Wait a tick for masonry to update
            await new Promise(resolve => setTimeout(resolve, 0))
          }

          // Clear error on successful load
          loadError.value = null

          // If no new items were found, automatically proceed to next page
          // This means the current page has no more items available
          if (newItems.length === 0) {
            const nextPageToLoad = paginationHistory.value[paginationHistory.value.length - 1]
            if (nextPageToLoad == null) {
              hasReachedEnd.value = true
              return
            }
            const nextResponse = await getContent(nextPageToLoad)
            if (cancelRequested.value) return
            loadError.value = null
            currentPage.value = nextPageToLoad
            paginationHistory.value.push(nextResponse.nextPage)
            if (nextResponse.nextPage == null) {
              hasReachedEnd.value = true
            }
            await maybeBackfillToTarget(baseline)
            return nextResponse
          }

          // If we now have enough items for current page, proceed to next page
          // Re-check count after items have been added
          const updatedCount = countItemsForPage(currentPage.value)
          if (updatedCount >= pageSize) {
            // Current page is now full, proceed with normal next page loading
            const nextPageToLoad = paginationHistory.value[paginationHistory.value.length - 1]
            if (nextPageToLoad == null) {
              hasReachedEnd.value = true
              return
            }
            const nextResponse = await getContent(nextPageToLoad)
            if (cancelRequested.value) return
            loadError.value = null
            currentPage.value = nextPageToLoad
            paginationHistory.value.push(nextResponse.nextPage)
            if (nextResponse.nextPage == null) {
              hasReachedEnd.value = true
            }
            await maybeBackfillToTarget(baseline)
            return nextResponse
          } else {
            // Still not enough items, but we refreshed - return the refresh response
            return response
          }
        }
      }

      // Normal flow: load next page
      const nextPageToLoad = paginationHistory.value[paginationHistory.value.length - 1]
      // Don't load if nextPageToLoad is null
      if (nextPageToLoad == null) {
        hasReachedEnd.value = true
        return
      }
      const response = await getContent(nextPageToLoad)
      if (cancelRequested.value) return
      // Clear error on successful load
      loadError.value = null
      currentPage.value = nextPageToLoad  // Track the current page
      paginationHistory.value.push(response.nextPage)
      // Update hasReachedEnd if nextPage is null
      if (response.nextPage == null) {
        hasReachedEnd.value = true
      }
      await maybeBackfillToTarget(baseline)
      return response
    } catch (error) {
      // Set load error - error is handled and exposed to UI via loadError
      loadError.value = normalizeError(error)
      throw error
    } finally {
      isLoading.value = false
      emits('loading:stop', { fetched: masonry.value.length })
    }
  }

  async function refreshCurrentPage() {
    if (isLoading.value) return
    cancelRequested.value = false
    isLoading.value = true
    emits('loading:start')

    try {
      // Use the tracked current page
      const pageToRefresh = currentPage.value

      if (pageToRefresh == null) {
        console.warn('[Masonry] No current page to refresh - currentPage:', currentPage.value, 'paginationHistory:', paginationHistory.value)
        return
      }

      // Clear existing items
      masonry.value = []
      // Reset end flag when refreshing
      hasReachedEnd.value = false
      // Reset error flag when refreshing
      loadError.value = null

      // Reset pagination history to just the current page
      paginationHistory.value = [pageToRefresh]

      // Reload the current page
      const response = await getContent(pageToRefresh)
      if (cancelRequested.value) return

      // Clear error on successful load
      loadError.value = null
      // Update pagination state
      currentPage.value = pageToRefresh
      paginationHistory.value.push(response.nextPage)
      // Update hasReachedEnd if nextPage is null
      if (response.nextPage == null) {
        hasReachedEnd.value = true
      }

      // Optionally backfill if needed
      const baseline = masonry.value.length
      await maybeBackfillToTarget(baseline)

      return response
    } catch (error) {
      // Set load error - error is handled and exposed to UI via loadError
      loadError.value = normalizeError(error)
      throw error
    } finally {
      isLoading.value = false
      emits('loading:stop', { fetched: masonry.value.length })
    }
  }

  function cancelLoad() {
    const wasBackfilling = backfillActive
    cancelRequested.value = true
    isLoading.value = false
    // Set backfillActive to false to immediately stop backfilling
    // The backfill loop checks this flag and will exit on the next iteration
    backfillActive = false
    // If backfill was active, emit stop event immediately
    if (wasBackfilling) {
      emits('backfill:stop', { fetched: masonry.value.length, calls: 0, cancelled: true })
    }
    emits('loading:stop', { fetched: masonry.value.length })
  }

  return {
    loadPage,
    loadNext,
    refreshCurrentPage,
    cancelLoad,
    maybeBackfillToTarget,
    getContent
  }
}

