import { afterEach, describe, expect, it, vi } from 'vitest'

import type { VibeResolveParams, VibeResolveResult } from '@/components/viewer-core/useDataSource'

import { mountUseDataSource } from '../helpers/mountUseDataSource'
import { createDeferred, createPageResult } from '../helpers/useDataSourceTestUtils'

describe('useDataSource dynamic mode', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('dynamically fills the initial batch until it reaches the page size', async () => {
    vi.useFakeTimers()

    const resolve = vi.fn(async ({ cursor }: VibeResolveParams) => {
      if (cursor === 'page-2') {
        return createPageResult('page-2', {
          itemCount: 3,
          nextPage: 'page-3',
          previousPage: 'page-1',
        })
      }

      if (cursor === 'page-3') {
        return createPageResult('page-3', {
          itemCount: 25,
          nextPage: 'page-4',
          previousPage: 'page-2',
        })
      }

      return createPageResult('page-1', {
        itemCount: 20,
        nextPage: 'page-2',
      })
    })

    const source = await mountUseDataSource({
      resolve,
    })

    await source.flush()

    expect(resolve).toHaveBeenCalledTimes(1)
    expect(source.api.phase.value).toBe('filling')
    expect(source.api.fillCollectedCount.value).toBe(20)
    expect(source.api.fillDelayRemainingMs.value).toBeGreaterThan(0)

    await vi.advanceTimersByTimeAsync(1_000)
    await source.flush()

    expect(resolve).toHaveBeenCalledTimes(2)
    expect(source.api.phase.value).toBe('filling')
    expect(source.api.fillCollectedCount.value).toBe(23)
    expect(source.api.fillDelayRemainingMs.value).toBeGreaterThan(0)

    await vi.advanceTimersByTimeAsync(1_250)
    await source.flush()

    expect(resolve).toHaveBeenCalledTimes(3)
    expect(resolve).toHaveBeenNthCalledWith(1, expect.objectContaining({
      cursor: null,
      pageSize: 25,
      signal: expect.any(AbortSignal),
    }))
    expect(resolve).toHaveBeenNthCalledWith(2, expect.objectContaining({
      cursor: 'page-2',
      pageSize: 25,
      signal: expect.any(AbortSignal),
    }))
    expect(resolve).toHaveBeenNthCalledWith(3, expect.objectContaining({
      cursor: 'page-3',
      pageSize: 25,
      signal: expect.any(AbortSignal),
    }))
    expect(source.api.mode.value).toBe('dynamic')
    expect(source.api.items.value).toHaveLength(48)
    expect(source.api.nextCursor.value).toBe('page-4')
    expect(source.api.currentCursor.value).toBeNull()
    expect(source.api.phase.value).toBe('idle')
    expect(source.api.fillCollectedCount.value).toBeNull()
    expect(source.api.fillDelayRemainingMs.value).toBeNull()
    expect(source.api.fillTargetCount.value).toBeNull()

    source.unmount()
  })

  it('fills appended batches in dynamic mode before exposing them for commit', async () => {
    vi.useFakeTimers()

    const deferred = createDeferred<VibeResolveResult>()
    const resolve = vi.fn(({ cursor }: VibeResolveParams) => {
      if (cursor === 'page-2') {
        return deferred.promise
      }

      if (cursor === 'page-3') {
        return Promise.resolve(createPageResult('page-3', {
          itemCount: 22,
          nextPage: 'page-4',
          previousPage: 'page-2',
        }))
      }

      return Promise.resolve(createPageResult('page-1', {
        nextPage: 'page-2',
      }))
    })

    const source = await mountUseDataSource({
      resolve,
      mode: 'dynamic',
    })

    await source.flush()

    source.api.setActiveIndex(24)
    await source.flush()

    expect(resolve).toHaveBeenCalledTimes(2)
    expect(source.api.loading.value).toBe(true)

    deferred.resolve(createPageResult('page-2', {
      itemCount: 3,
      nextPage: 'page-3',
      previousPage: 'page-1',
    }))
    await source.flush()

    expect(resolve).toHaveBeenCalledTimes(2)
    expect(source.api.phase.value).toBe('filling')
    expect(source.api.fillCollectedCount.value).toBe(3)
    expect(source.api.fillDelayRemainingMs.value).toBeGreaterThan(0)
    expect(source.api.fillTargetCount.value).toBe(25)

    await vi.advanceTimersByTimeAsync(1_000)
    await source.flush()

    expect(resolve).toHaveBeenCalledTimes(3)
    expect(source.api.pendingAppendItems.value).toHaveLength(25)
    expect(source.api.nextCursor.value).toBe('page-2')
    expect(source.api.fillDelayRemainingMs.value).toBeNull()

    await source.api.commitPendingAppend()
    await source.flush()

    expect(source.api.items.value).toHaveLength(50)
    expect(source.api.nextCursor.value).toBe('page-4')
    expect(source.api.phase.value).toBe('idle')

    source.unmount()
  })

  it('uses custom dynamic fill delay props when chaining additional resolve calls', async () => {
    vi.useFakeTimers()

    const resolve = vi.fn(async ({ cursor }: VibeResolveParams) => {
      if (cursor === 'page-2') {
        return createPageResult('page-2', {
          itemCount: 3,
          nextPage: 'page-3',
          previousPage: 'page-1',
        })
      }

      if (cursor === 'page-3') {
        return createPageResult('page-3', {
          itemCount: 22,
          nextPage: 'page-4',
          previousPage: 'page-2',
        })
      }

      return createPageResult('page-1', {
        itemCount: 20,
        nextPage: 'page-2',
      })
    })

    const source = await mountUseDataSource({
      fillDelayMs: 200,
      fillDelayStepMs: 50,
      resolve,
    })

    await source.flush()
    expect(resolve).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(199)
    await source.flush()
    expect(resolve).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(1)
    await source.flush()
    expect(resolve).toHaveBeenCalledTimes(2)

    await vi.advanceTimersByTimeAsync(249)
    await source.flush()
    expect(resolve).toHaveBeenCalledTimes(2)

    await vi.advanceTimersByTimeAsync(1)
    await source.flush()
    expect(resolve).toHaveBeenCalledTimes(3)

    source.unmount()
  })
})
