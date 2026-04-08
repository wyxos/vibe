import { afterEach, describe, expect, it, vi } from 'vitest'

import { createAssetErrorBatchReporter, DEFAULT_ASSET_ERROR_BATCH_WINDOW_MS, type VibeAssetErrorEvent } from '@/components/viewer-core/assetErrors'

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
