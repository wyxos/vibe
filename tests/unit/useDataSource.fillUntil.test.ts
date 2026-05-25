import { afterEach, describe, expect, it, vi } from 'vitest'

import type { VibeResolveParams, VibeResolveResult } from '@/components/viewer-core/useDataSource'

import { mountUseDataSource } from '../helpers/mountUseDataSource'
import { createDeferred, createItems, createPageResult } from '../helpers/useDataSourceTestUtils'

describe('useDataSource fillUntil handle methods', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('fills until the next cursor reaches the requested cursor without loading that cursor', async () => {
    const resolve = vi.fn(async ({ cursor }: VibeResolveParams) => {
      if (cursor === 'page-2') {
        return createPageResult('page-2', {
          nextPage: 'page-3',
          previousPage: 'page-1',
        })
      }

      if (cursor === 'page-3') {
        return createPageResult('page-3', {
          nextPage: 'page-4',
          previousPage: 'page-2',
        })
      }

      throw new Error(`Unexpected cursor ${String(cursor)}`)
    })

    const source = await mountUseDataSource(createInitialProps(resolve))

    await source.api.fillUntil('page-4')
    await source.flush()

    expect(resolve.mock.calls.map(([params]) => params.cursor)).toEqual(['page-2', 'page-3'])
    expect(source.api.items.value).toHaveLength(75)
    expect(source.api.nextCursor.value).toBe('page-4')
    expect(source.api.isPageLoadingLocked.value).toBe(false)
    expect(source.api.fillCompletedCalls.value).toBe(2)
    expect(source.api.fillLoadedCount.value).toBe(75)
    expect(source.api.fillMode.value).toBe('idle')
    expect(source.api.fillProgress.value).toBeNull()
    expect(source.api.fillTargetCalls.value).toBeNull()
    expect(source.api.phase.value).toBe('idle')

    source.unmount()
  })

  it('fills by an exact number of resolve calls', async () => {
    const resolve = vi.fn(async ({ cursor }: VibeResolveParams) => {
      if (cursor === 'page-2') {
        return createPageResult('page-2', {
          nextPage: 'page-3',
          previousPage: 'page-1',
        })
      }

      if (cursor === 'page-3') {
        return createPageResult('page-3', {
          nextPage: 'page-4',
          previousPage: 'page-2',
        })
      }

      if (cursor === 'page-4') {
        return createPageResult('page-4', {
          nextPage: 'page-5',
          previousPage: 'page-3',
        })
      }

      throw new Error(`Unexpected cursor ${String(cursor)}`)
    })

    const source = await mountUseDataSource(createInitialProps(resolve))

    await source.api.fillUntil(2)
    await source.flush()

    expect(resolve.mock.calls.map(([params]) => params.cursor)).toEqual(['page-2', 'page-3'])
    expect(source.api.items.value).toHaveLength(75)
    expect(source.api.nextCursor.value).toBe('page-4')
    expect(source.api.fillCompletedCalls.value).toBe(2)
    expect(source.api.fillLoadedCount.value).toBe(75)
    expect(source.api.fillMode.value).toBe('idle')
    expect(source.api.fillProgress.value).toBe(1)
    expect(source.api.fillTargetCalls.value).toBe(2)

    source.unmount()
  })

  it('respects the configured fill delay between fillUntil calls', async () => {
    vi.useFakeTimers()

    const resolve = vi.fn(async ({ cursor }: VibeResolveParams) => {
      if (cursor === 'page-2') {
        return createPageResult('page-2', {
          nextPage: 'page-3',
          previousPage: 'page-1',
        })
      }

      if (cursor === 'page-3') {
        return createPageResult('page-3', {
          nextPage: 'page-4',
          previousPage: 'page-2',
        })
      }

      throw new Error(`Unexpected cursor ${String(cursor)}`)
    })

    const source = await mountUseDataSource({
      ...createInitialProps(resolve),
      fillDelayMs: 200,
      fillDelayStepMs: 50,
    })

    const filling = source.api.fillUntil(2)
    await source.flush()

    expect(resolve.mock.calls.map(([params]) => params.cursor)).toEqual(['page-2'])
    expect(source.api.phase.value).toBe('filling')
    expect(source.api.fillCompletedCalls.value).toBe(1)
    expect(source.api.fillCursor.value).toBe('page-3')
    expect(source.api.fillDelayRemainingMs.value).toBeGreaterThan(0)
    expect(source.api.fillMode.value).toBe('count')
    expect(source.api.fillProgress.value).toBe(0.5)
    expect(source.api.fillTargetCalls.value).toBe(2)

    await vi.advanceTimersByTimeAsync(199)
    await source.flush()

    expect(resolve).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(1)
    await filling
    await source.flush()

    expect(resolve.mock.calls.map(([params]) => params.cursor)).toEqual(['page-2', 'page-3'])
    expect(source.api.nextCursor.value).toBe('page-4')
    expect(source.api.fillDelayRemainingMs.value).toBeNull()
    expect(source.api.fillCompletedCalls.value).toBe(2)
    expect(source.api.fillMode.value).toBe('idle')
    expect(source.api.fillProgress.value).toBe(1)

    source.unmount()
  })

  it('caps the configured fill delay between fillUntil calls', async () => {
    vi.useFakeTimers()

    const resolve = vi.fn(async ({ cursor }: VibeResolveParams) => {
      if (cursor === 'page-2') {
        return createPageResult('page-2', {
          nextPage: 'page-3',
          previousPage: 'page-1',
        })
      }

      if (cursor === 'page-3') {
        return createPageResult('page-3', {
          nextPage: 'page-4',
          previousPage: 'page-2',
        })
      }

      if (cursor === 'page-4') {
        return createPageResult('page-4', {
          nextPage: 'page-5',
          previousPage: 'page-3',
        })
      }

      throw new Error(`Unexpected cursor ${String(cursor)}`)
    })

    const source = await mountUseDataSource({
      ...createInitialProps(resolve),
      fillDelayMaxMs: 225,
      fillDelayMs: 200,
      fillDelayStepMs: 50,
    })

    const filling = source.api.fillUntil(3)
    await source.flush()

    expect(resolve.mock.calls.map(([params]) => params.cursor)).toEqual(['page-2'])

    await vi.advanceTimersByTimeAsync(199)
    await source.flush()

    expect(resolve).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(1)
    await source.flush()

    expect(resolve.mock.calls.map(([params]) => params.cursor)).toEqual(['page-2', 'page-3'])

    await vi.advanceTimersByTimeAsync(224)
    await source.flush()

    expect(resolve).toHaveBeenCalledTimes(2)

    await vi.advanceTimersByTimeAsync(1)
    await filling
    await source.flush()

    expect(resolve.mock.calls.map(([params]) => params.cursor)).toEqual(['page-2', 'page-3', 'page-4'])
    expect(source.api.fillDelayRemainingMs.value).toBeNull()

    source.unmount()
  })

  it('cancels a fillUntil sequence while it is waiting for the next delayed call', async () => {
    vi.useFakeTimers()

    const resolve = vi.fn(async ({ cursor }: VibeResolveParams) => {
      if (cursor === 'page-2') {
        return createPageResult('page-2', {
          nextPage: 'page-3',
          previousPage: 'page-1',
        })
      }

      if (cursor === 'page-3') {
        return createPageResult('page-3', {
          nextPage: 'page-4',
          previousPage: 'page-2',
        })
      }

      throw new Error(`Unexpected cursor ${String(cursor)}`)
    })

    const source = await mountUseDataSource({
      ...createInitialProps(resolve),
      fillDelayMs: 200,
      fillDelayStepMs: 0,
    })

    const filling = source.api.fillUntil(2)
    await source.flush()

    expect(source.api.fillMode.value).toBe('count')
    expect(source.api.fillCompletedCalls.value).toBe(1)
    expect(source.api.fillCursor.value).toBe('page-3')

    source.api.cancelFill()
    await filling
    await source.flush()
    await vi.advanceTimersByTimeAsync(250)

    expect(resolve.mock.calls.map(([params]) => params.cursor)).toEqual(['page-2'])
    expect(source.api.items.value).toHaveLength(50)
    expect(source.api.nextCursor.value).toBe('page-3')
    expect(source.api.isPageLoadingLocked.value).toBe(false)
    expect(source.api.fillDelayRemainingMs.value).toBeNull()
    expect(source.api.fillMode.value).toBe('idle')
    expect(source.api.phase.value).toBe('idle')

    source.unmount()
  })

  it('cancels an in-flight fillUntilEnd resolve request', async () => {
    let capturedSignal: AbortSignal | undefined
    const resolve = vi.fn(({ cursor, signal }: VibeResolveParams) => {
      if (cursor !== 'page-2') {
        return Promise.reject(new Error(`Unexpected cursor ${String(cursor)}`))
      }

      capturedSignal = signal

      return new Promise<VibeResolveResult>((_resolve, reject) => {
        signal?.addEventListener('abort', () => {
          const error = new Error('Aborted')
          error.name = 'AbortError'
          reject(error)
        }, { once: true })
      })
    })

    const source = await mountUseDataSource(createInitialProps(resolve))

    const filling = source.api.fillUntilEnd()
    await source.flush()

    expect(source.api.fillMode.value).toBe('end')
    expect(source.api.isPageLoadingLocked.value).toBe(true)

    source.api.cancelFill()
    await filling
    await source.flush()

    expect(capturedSignal?.aborted).toBe(true)
    expect(resolve).toHaveBeenCalledTimes(1)
    expect(source.api.items.value).toHaveLength(25)
    expect(source.api.nextCursor.value).toBe('page-2')
    expect(source.api.isPageLoadingLocked.value).toBe(false)
    expect(source.api.fillMode.value).toBe('idle')
    expect(source.api.phase.value).toBe('idle')

    source.unmount()
  })

  it('fills until the end cursor is exhausted', async () => {
    const resolve = vi.fn(async ({ cursor }: VibeResolveParams) => {
      if (cursor === 'page-2') {
        return createPageResult('page-2', {
          nextPage: 'page-3',
          previousPage: 'page-1',
          total: 75,
        })
      }

      if (cursor === 'page-3') {
        return createPageResult('page-3', {
          nextPage: null,
          previousPage: 'page-2',
          total: 75,
        })
      }

      throw new Error(`Unexpected cursor ${String(cursor)}`)
    })

    const source = await mountUseDataSource(createInitialProps(resolve))

    await source.api.fillUntilEnd()
    await source.flush()

    expect(resolve.mock.calls.map(([params]) => params.cursor)).toEqual(['page-2', 'page-3'])
    expect(source.api.items.value).toHaveLength(75)
    expect(source.api.hasNextPage.value).toBe(false)
    expect(source.api.fillCompletedCalls.value).toBe(2)
    expect(source.api.fillLoadedCount.value).toBe(75)
    expect(source.api.fillMode.value).toBe('idle')
    expect(source.api.fillProgress.value).toBe(1)
    expect(source.api.fillTotalCount.value).toBe(75)
    expect(source.api.phase.value).toBe('idle')

    source.unmount()
  })

  it('tracks fillUntilEnd calls and loaded count when no total is provided', async () => {
    const resolve = vi.fn(async ({ cursor }: VibeResolveParams) => {
      if (cursor === 'page-2') {
        return createPageResult('page-2', {
          nextPage: 'page-3',
          previousPage: 'page-1',
        })
      }

      if (cursor === 'page-3') {
        return createPageResult('page-3', {
          nextPage: null,
          previousPage: 'page-2',
        })
      }

      throw new Error(`Unexpected cursor ${String(cursor)}`)
    })

    const source = await mountUseDataSource(createInitialProps(resolve))

    await source.api.fillUntilEnd()
    await source.flush()

    expect(source.api.fillCompletedCalls.value).toBe(2)
    expect(source.api.fillLoadedCount.value).toBe(75)
    expect(source.api.fillProgress.value).toBeNull()
    expect(source.api.fillTotalCount.value).toBeNull()

    source.unmount()
  })

  it('continues fill sequences through empty pages and counts them as calls', async () => {
    const resolve = vi.fn(async ({ cursor }: VibeResolveParams) => {
      if (cursor === 'page-2') {
        return createPageResult('page-2', {
          itemCount: 0,
          nextPage: 'page-3',
          previousPage: 'page-1',
        })
      }

      if (cursor === 'page-3') {
        return createPageResult('page-3', {
          nextPage: 'page-4',
          previousPage: 'page-2',
        })
      }

      throw new Error(`Unexpected cursor ${String(cursor)}`)
    })

    const source = await mountUseDataSource(createInitialProps(resolve))

    await source.api.fillUntil(2)
    await source.flush()

    expect(resolve.mock.calls.map(([params]) => params.cursor)).toEqual(['page-2', 'page-3'])
    expect(source.api.items.value).toHaveLength(50)
    expect(source.api.nextCursor.value).toBe('page-4')
    expect(source.api.fillCompletedCalls.value).toBe(2)
    expect(source.api.fillLoadedCount.value).toBe(50)
    expect(source.api.fillProgress.value).toBe(1)

    source.unmount()
  })

  it('blocks manual next loading while fillUntil is active', async () => {
    const deferred = createDeferred<VibeResolveResult>()
    const resolve = vi.fn(({ cursor }: VibeResolveParams) => {
      if (cursor === 'page-2') {
        return deferred.promise
      }

      return Promise.reject(new Error(`Unexpected cursor ${String(cursor)}`))
    })

    const source = await mountUseDataSource(createInitialProps(resolve))

    const filling = source.api.fillUntil(1)
    await source.flush()

    expect(source.api.isPageLoadingLocked.value).toBe(true)
    expect(source.api.fillCompletedCalls.value).toBe(0)
    expect(source.api.fillMode.value).toBe('count')
    expect(source.api.fillProgress.value).toBe(0)
    expect(source.api.fillTargetCalls.value).toBe(1)
    expect(resolve.mock.calls.map(([params]) => params.cursor)).toEqual(['page-2'])

    await source.api.loadNext()
    await source.flush()

    expect(resolve).toHaveBeenCalledTimes(1)

    deferred.resolve(createPageResult('page-2', {
      nextPage: 'page-3',
      previousPage: 'page-1',
    }))
    await filling
    await source.flush()

    expect(resolve).toHaveBeenCalledTimes(1)
    expect(source.api.items.value).toHaveLength(50)
    expect(source.api.nextCursor.value).toBe('page-3')
    expect(source.api.isPageLoadingLocked.value).toBe(false)

    source.unmount()
  })
})

function createInitialProps(resolve: (params: VibeResolveParams) => Promise<VibeResolveResult>) {
  return {
    initialState: {
      cursor: 'page-1',
      items: createItems('page-1'),
      nextCursor: 'page-2',
    },
    resolve,
  }
}
