import type {
  CreateVibeOptions,
  VibeCursor,
  VibePageRequest,
} from '../types'
import { collectFrontendAutofill, frontendAutofillRequestLimit } from './autofill'
import type { VibeAutofillController } from './autofillController'
import { startBackendAutofill } from './backendAutofill'
import { appendUniqueItems, validatePage, type LoadedPageRecord } from './page'
import type { VibeRuntimeState } from './runtime'

interface PageRequestOptions {
  append: boolean
  autofillController: VibeAutofillController
  cursor: VibeCursor
  isCurrent: () => boolean
  loadPage: (request: VibePageRequest) => ReturnType<NonNullable<CreateVibeOptions['loadPage']>>
  onLastCursor: (cursor: VibeCursor) => void
  onPages: (pages: readonly LoadedPageRecord[]) => void
  options: CreateVibeOptions
  signal: AbortSignal
  state: VibeRuntimeState
}

export async function performPageRequest({
  append,
  autofillController,
  cursor,
  isCurrent,
  loadPage,
  onLastCursor,
  onPages,
  options,
  signal,
  state,
}: PageRequestOptions): Promise<void> {
  const autofillOptions = options.autofill
  const resumesFrontendAutofill = append
    && autofillOptions?.strategy === 'frontend'
    && (state.autofill.status === 'paused' || state.autofill.status === 'error')
  const resumeProgress = resumesFrontendAutofill
    ? { received: state.autofill.received, requests: state.autofill.requests }
    : null
  const cycleId = autofillOptions
    ? resumesFrontendAutofill
      ? state.autofill.cycleId
      : autofillController.beginCycle()
    : null
  if (resumesFrontendAutofill) {
    Object.assign(state.autofill, { error: null, status: 'filling' })
  }
  let pageCommitted = false

  try {
    if (autofillOptions?.strategy === 'frontend') {
      const result = await collectFrontendAutofill({
        existingItems: append ? state.items : [],
        initialCursor: cursor,
        loadPage,
        maximumRequests: resumeProgress
          ? Math.max(
              0,
              frontendAutofillRequestLimit(autofillOptions) - resumeProgress.requests,
            )
          : undefined,
        onCollection: (collection) => autofillController.captureCollection(
          collection, isCurrent(),
        ),
        onDelayChange: (delay) => {
          if (isCurrent()) Object.assign(state.autofill, delay)
        },
        onProgress: (progress) => {
          if (!isCurrent()) return
          Object.assign(state.autofill, progress, { status: 'filling' })
        },
        options: autofillOptions,
        receivedOffset: resumeProgress?.received,
        requestOffset: resumeProgress?.requests,
        shouldPause: () => state.loadMoreLocked,
        signal,
      })
      if (!isCurrent()) return

      state.items = append
        ? appendUniqueItems(state.items, result.items)
        : [...result.items]
      onLastCursor(result.lastCursor)
      state.next = result.next
      if (result.total !== undefined) state.total = result.total
      Object.assign(state.autofill, {
        missing: result.missing,
        received: result.received,
        requests: result.requests,
        status: result.status,
      })
      onPages(result.pages)
      autofillController.clearCollection()
      return
    }

    const page = validatePage(await loadPage({ cursor, signal }))
    if (!isCurrent()) return

    const currentItems = append ? state.items : []
    const items = appendUniqueItems(currentItems, page.items)
    const received = items.length - currentItems.length
    state.items = items
    onLastCursor(cursor)
    onPages([{
      contributionIds: items.slice(currentItems.length).map(({ postId }) => postId),
      cursor,
      next: page.next,
      returnedIds: page.items.map(({ postId }) => postId),
    }])
    state.next = page.next
    if (page.total !== undefined) state.total = page.total
    pageCommitted = true

    if (autofillOptions?.strategy === 'backend' && cycleId) {
      Object.assign(state.autofill, {
        missing: Math.max(0, autofillOptions.pageSize - received),
        received,
        requests: 1,
      })
      if (received >= autofillOptions.pageSize) {
        state.autofill.status = 'complete'
        return
      }

      await startBackendAutofill(autofillOptions, state, {
        cycleId,
        feedKey: autofillOptions.feedKey,
        items: items.slice(currentItems.length),
        missing: autofillOptions.pageSize - received,
        next: page.next,
        pageSize: autofillOptions.pageSize,
        received,
        signal,
        total: state.total,
      }, isCurrent)
      autofillController.syncCountdown()
    }
  } catch (error: unknown) {
    if (signal.aborted || !isCurrent()) return
    const partialCommitted = autofillOptions?.strategy === 'frontend'
      ? autofillController.commitCollection()
      : false
    if (autofillOptions) {
      state.autofill.error = error
      state.autofill.status = 'error'
    }
    if (!pageCommitted) {
      if (append || partialCommitted) state.nextPageError = error
      else state.error = error
    }
  } finally {
    if (isCurrent()) {
      autofillController.clearCollection()
      state.isLoading = false
      state.isLoadingMore = false
    }
  }
}
