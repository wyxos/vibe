import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  createAssetErrorBatchReporter,
  createAssetLoadBatchReporter,
  DEFAULT_ASSET_ERROR_BATCH_WINDOW_MS,
  type VibeAssetErrorEvent,
  type VibeAssetLoadEvent,
} from '@/components/viewer-core/assetErrors'

describe('createAssetErrorBatchReporter', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('dedupes identical failures within one batch and allows the same failure again later', async () => {
    vi.useFakeTimers()

    const emitErrors = vi.fn()
    const reporter = createAssetErrorBatchReporter(emitErrors)
    const failedEvent: VibeAssetErrorEvent = {
      item: {
        id: 'broken-image',
        type: 'image',
        title: 'Broken image',
        url: 'https://example.com/broken-image.jpg',
      },
      occurrenceKey: 'broken-image',
      url: 'https://example.com/broken-image.jpg',
      kind: 'generic',
      surface: 'grid',
    }

    reporter.report(failedEvent)
    reporter.report({ ...failedEvent })

    await vi.advanceTimersByTimeAsync(DEFAULT_ASSET_ERROR_BATCH_WINDOW_MS)

    expect(emitErrors).toHaveBeenCalledTimes(1)
    expect(emitErrors.mock.calls[0][0]).toEqual([failedEvent])

    reporter.report(failedEvent)

    await vi.advanceTimersByTimeAsync(DEFAULT_ASSET_ERROR_BATCH_WINDOW_MS)

    expect(emitErrors).toHaveBeenCalledTimes(2)
    expect(emitErrors.mock.calls[1][0]).toEqual([failedEvent])

    reporter.stop()
  })
})

describe('createAssetLoadBatchReporter', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('dedupes identical successes within one batch and allows the same success again later', async () => {
    vi.useFakeTimers()

    const emitLoads = vi.fn()
    const reporter = createAssetLoadBatchReporter(emitLoads)
    const loadedEvent: VibeAssetLoadEvent = {
      item: {
        id: 'ready-image',
        type: 'image',
        title: 'Ready image',
        url: 'https://example.com/ready-image.jpg',
      },
      occurrenceKey: 'ready-image',
      surface: 'grid',
      url: 'https://example.com/ready-image-preview.jpg',
    }

    reporter.report(loadedEvent)
    reporter.report({ ...loadedEvent })

    await vi.advanceTimersByTimeAsync(DEFAULT_ASSET_ERROR_BATCH_WINDOW_MS)

    expect(emitLoads).toHaveBeenCalledTimes(1)
    expect(emitLoads.mock.calls[0][0]).toEqual([loadedEvent])

    reporter.report(loadedEvent)

    await vi.advanceTimersByTimeAsync(DEFAULT_ASSET_ERROR_BATCH_WINDOW_MS)

    expect(emitLoads).toHaveBeenCalledTimes(2)
    expect(emitLoads.mock.calls[1][0]).toEqual([loadedEvent])

    reporter.stop()
  })
})
