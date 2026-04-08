import type { VibeViewerItem } from '../viewer'
import type { VibeAssetErrorKind } from './loadError'

export type VibeAssetErrorSurface = 'fullscreen' | 'grid'
export type VibeAssetLoadSurface = VibeAssetErrorSurface

export interface VibeAssetErrorEvent {
  item: VibeViewerItem
  occurrenceKey: string
  url: string
  kind: VibeAssetErrorKind
  surface: VibeAssetErrorSurface
}

export interface VibeAssetLoadEvent {
  item: VibeViewerItem
  occurrenceKey: string
  surface: VibeAssetLoadSurface
  url: string
}

export type VibeAssetErrorReporter = (error: VibeAssetErrorEvent) => void
export type VibeAssetLoadReporter = (load: VibeAssetLoadEvent) => void

export const DEFAULT_ASSET_ERROR_BATCH_WINDOW_MS = 150

export function createAssetErrorBatchReporter(
  emitErrors: (errors: VibeAssetErrorEvent[]) => void,
  batchWindowMs = DEFAULT_ASSET_ERROR_BATCH_WINDOW_MS,
) {
  return createAssetBatchReporter(
    emitErrors,
    (error) => `${error.surface}|${error.occurrenceKey}|${error.url}|${error.kind}`,
    batchWindowMs,
  )
}

export function createAssetLoadBatchReporter(
  emitLoads: (loads: VibeAssetLoadEvent[]) => void,
  batchWindowMs = DEFAULT_ASSET_ERROR_BATCH_WINDOW_MS,
) {
  return createAssetBatchReporter(
    emitLoads,
    (load) => `${load.surface}|${load.occurrenceKey}|${load.url}`,
    batchWindowMs,
  )
}

function createAssetBatchReporter<T>(
  emitBatch: (entries: T[]) => void,
  getQueueKey: (entry: T) => string,
  batchWindowMs: number,
) {
  const queuedEntries: T[] = []
  const queuedKeys = new Set<string>()
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null

  function report(entry: T) {
    const queueKey = getQueueKey(entry)

    if (queuedKeys.has(queueKey)) {
      return
    }

    queuedKeys.add(queueKey)
    queuedEntries.push(entry)

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

    if (!queuedEntries.length) {
      return
    }

    const nextBatch = queuedEntries.slice()
    queuedEntries.length = 0
    queuedKeys.clear()
    emitBatch(nextBatch)
  }

  function stop() {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle)
      timeoutHandle = null
    }

    queuedEntries.length = 0
    queuedKeys.clear()
  }

  return {
    flush,
    report,
    stop,
  }
}
