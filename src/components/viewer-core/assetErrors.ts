import type { VibeViewerItem } from '../viewer'
import type { VibeAssetErrorKind } from './loadError'

export type VibeAssetErrorSurface = 'fullscreen' | 'grid'

export interface VibeAssetErrorEvent {
  item: VibeViewerItem
  occurrenceKey: string
  url: string
  kind: VibeAssetErrorKind
  surface: VibeAssetErrorSurface
}

export type VibeAssetErrorReporter = (error: VibeAssetErrorEvent) => void

export const DEFAULT_ASSET_ERROR_BATCH_WINDOW_MS = 150

export function createAssetErrorBatchReporter(
  emitErrors: (errors: VibeAssetErrorEvent[]) => void,
  batchWindowMs = DEFAULT_ASSET_ERROR_BATCH_WINDOW_MS,
) {
  const queuedErrors: VibeAssetErrorEvent[] = []
  const queuedKeys = new Set<string>()
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null

  function report(error: VibeAssetErrorEvent) {
    const queueKey = `${error.surface}|${error.occurrenceKey}|${error.url}|${error.kind}`

    if (queuedKeys.has(queueKey)) {
      return
    }

    queuedKeys.add(queueKey)
    queuedErrors.push(error)

    if (timeoutHandle) {
      return
    }

    timeoutHandle = setTimeout(() => {
      flush()
    }, batchWindowMs)
  }

  function flush() {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle)
      timeoutHandle = null
    }

    if (!queuedErrors.length) {
      return
    }

    const nextBatch = queuedErrors.slice()
    queuedErrors.length = 0
    queuedKeys.clear()
    emitErrors(nextBatch)
  }

  function stop() {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle)
      timeoutHandle = null
    }

    queuedErrors.length = 0
    queuedKeys.clear()
  }

  return {
    flush,
    report,
    stop,
  }
}
