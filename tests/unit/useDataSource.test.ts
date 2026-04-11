import { afterEach, describe, expect, it, vi } from 'vitest'

import type { VibeResolveParams, VibeResolveResult } from '@/components/viewer-core/useDataSource'

import { mountUseDataSource } from '../helpers/mountUseDataSource'
import {
  createDeferred,
  createItems,
  createPageResult,
  createSimpleItem,
  getVisibleIds,
} from '../helpers/useDataSourceTestUtils'

describe('useDataSource', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('marks the first unresolved request as initializing before the initial page resolves', async () => {
    const deferred = createDeferred<VibeResolveResult>()
    const resolve = vi.fn(() => deferred.promise)

    const source = await mountUseDataSource({
      resolve,
    })

    expect(source.api.phase.value).toBe('initializing')
    expect(source.api.loading.value).toBe(true)

    deferred.resolve(createPageResult('page-1', {
      nextPage: 'page-2',
    }))
    await source.flush()

    expect(source.api.phase.value).toBe('idle')
    expect(source.api.loading.value).toBe(false)
    expect(source.api.items.value).toHaveLength(25)

    source.unmount()
  })

  it('loads the initial page from resolve with the default page size', async () => {
    const resolve = vi.fn(async ({ cursor, pageSize }: VibeResolveParams) => {
      expect(cursor).toBeNull()
      expect(pageSize).toBe(25)

      return createPageResult('page-1', {
        nextPage: 'page-2',
      })
    })

    const source = await mountUseDataSource({
      resolve,
    })

    await source.flush()

    expect(resolve).toHaveBeenCalledTimes(1)
    expect(source.api.items.value).toHaveLength(25)
    expect(source.api.activeIndex.value).toBe(0)
    expect(source.api.hasNextPage.value).toBe(true)

    source.unmount()
  })

  it('prefetches the next page near the end and avoids duplicate cursor requests', async () => {
    const deferred = createDeferred<VibeResolveResult>()
    const resolve = vi.fn(({ cursor }: VibeResolveParams) => {
      if (cursor === 'page-2') {
        return deferred.promise
      }

      return Promise.resolve(createPageResult('page-1', {
        nextPage: 'page-2',
      }))
    })

    const source = await mountUseDataSource({
      resolve,
    })

    await source.flush()

    source.api.setActiveIndex(22)
    source.api.setActiveIndex(23)
    await source.flush()

    expect(resolve).toHaveBeenCalledTimes(2)
    expect(source.api.phase.value).toBe('loading')
    expect(resolve).toHaveBeenLastCalledWith(expect.objectContaining({
      cursor: 'page-2',
      pageSize: 25,
      signal: expect.any(AbortSignal),
    }))

    deferred.resolve(createPageResult('page-2'))
    await source.flush()

    expect(source.api.items.value).toHaveLength(25)
    expect(source.api.pendingAppendItems.value).toHaveLength(25)

    await source.api.commitPendingAppend()
    await source.flush()

    expect(source.api.items.value).toHaveLength(50)
    expect(source.api.pendingAppendItems.value).toHaveLength(0)
    expect(source.api.phase.value).toBe('idle')

    source.unmount()
  })

  it('prepends an unseen previous page when previousPage is available', async () => {
    const resolve = vi.fn(async ({ cursor }: VibeResolveParams) => {
      if (cursor === 'page-9') {
        return createPageResult('page-9', {
          nextPage: 'page-10',
          previousPage: 'page-8',
        })
      }

      return createPageResult('page-10', {
        nextPage: 'page-11',
        previousPage: 'page-9',
      })
    })

    const source = await mountUseDataSource({
      resolve,
      initialCursor: 'page-10',
    })

    await source.flush()
    source.api.setActiveIndex(1)
    await source.flush()

    expect(resolve).toHaveBeenCalledTimes(2)
    expect(resolve).toHaveBeenLastCalledWith(expect.objectContaining({
      cursor: 'page-9',
      pageSize: 25,
      signal: expect.any(AbortSignal),
    }))
    expect(source.api.items.value).toHaveLength(50)
    expect(source.api.activeIndex.value).toBe(26)

    source.unmount()
  })

  it('does not fetch an unseen previous page when previousPage is missing', async () => {
    const resolve = vi.fn(async () => createPageResult('page-1', {
      nextPage: 'page-2',
      previousPage: null,
    }))

    const source = await mountUseDataSource({
      resolve,
      initialCursor: 'page-1',
    })

    await source.flush()
    source.api.setActiveIndex(1)
    await source.flush()

    expect(resolve).toHaveBeenCalledTimes(1)

    source.unmount()
  })

  it('reloads the current trailing cursor in static mode before advancing to the next cursor', async () => {
    let rootPageLoads = 0
    const resolve = vi.fn(async ({ cursor }: VibeResolveParams) => {
      if (cursor === 'page-2') {
        return createPageResult('page-2', {
          nextPage: 'page-3',
          previousPage: 'page-1',
        })
      }

      rootPageLoads += 1

      return createPageResult(rootPageLoads === 1 ? 'page-1' : 'page-1-refilled', {
        nextPage: 'page-2',
      })
    })

    const source = await mountUseDataSource({
      resolve,
      mode: 'static',
    })

    await source.flush()

    expect(source.api.items.value).toHaveLength(25)

    source.api.remove(createItems('page-1').slice(0, 5).map((item) => item.id))
    await source.flush()

    expect(source.api.items.value).toHaveLength(20)

    await source.api.prefetchNextPage()
    await source.flush()

    expect(resolve).toHaveBeenCalledTimes(2)
    expect(resolve).toHaveBeenLastCalledWith(expect.objectContaining({
      cursor: null,
      pageSize: 25,
      signal: expect.any(AbortSignal),
    }))
    expect(source.api.phase.value).toBe('idle')
    expect(source.api.items.value).toHaveLength(25)
    expect(getVisibleIds(source.api.items.value).slice(0, 5)).toEqual([
      'page-1-refilled-item-1',
      'page-1-refilled-item-2',
      'page-1-refilled-item-3',
      'page-1-refilled-item-4',
      'page-1-refilled-item-5',
    ])

    await source.api.prefetchNextPage()
    await source.flush()

    expect(resolve).toHaveBeenCalledTimes(3)
    expect(resolve).toHaveBeenLastCalledWith(expect.objectContaining({
      cursor: 'page-2',
      pageSize: 25,
      signal: expect.any(AbortSignal),
    }))
    expect(source.api.pendingAppendItems.value).toHaveLength(25)

    source.unmount()
  })

  it('reloads the current leading cursor in static mode before prepending a previous cursor', async () => {
    let pageTwoLoads = 0
    const resolve = vi.fn(async ({ cursor }: VibeResolveParams) => {
      if (cursor === 'page-1') {
        return createPageResult('page-1', {
          nextPage: 'page-2',
        })
      }

      pageTwoLoads += 1

      return createPageResult(pageTwoLoads === 1 ? 'page-2' : 'page-2-refilled', {
        nextPage: 'page-3',
        previousPage: 'page-1',
      })
    })

    const source = await mountUseDataSource({
      initialCursor: 'page-2',
      mode: 'static',
      resolve,
    })

    await source.flush()

    source.api.remove(createItems('page-2').slice(0, 5).map((item) => item.id))
    await source.flush()

    expect(source.api.items.value).toHaveLength(20)

    await source.api.prefetchPreviousPage()
    await source.flush()

    expect(resolve).toHaveBeenCalledTimes(2)
    expect(resolve).toHaveBeenLastCalledWith(expect.objectContaining({
      cursor: 'page-2',
      pageSize: 25,
      signal: expect.any(AbortSignal),
    }))
    expect(source.api.items.value).toHaveLength(25)
    expect(getVisibleIds(source.api.items.value).slice(0, 5)).toEqual([
      'page-2-refilled-item-1',
      'page-2-refilled-item-2',
      'page-2-refilled-item-3',
      'page-2-refilled-item-4',
      'page-2-refilled-item-5',
    ])

    await source.api.prefetchPreviousPage()
    await source.flush()

    expect(resolve).toHaveBeenCalledTimes(3)
    expect(resolve).toHaveBeenLastCalledWith(expect.objectContaining({
      cursor: 'page-1',
      pageSize: 25,
      signal: expect.any(AbortSignal),
    }))

    source.unmount()
  })

  it('retries the initial load after a failure', async () => {
    const resolve = vi.fn()
      .mockRejectedValueOnce(new Error('Temporary failure'))
      .mockResolvedValueOnce(createPageResult('page-1', {
        nextPage: 'page-2',
      }))

    const source = await mountUseDataSource({
      resolve,
    })

    await source.flush()

    expect(source.api.errorMessage.value).toBe('Temporary failure')
    expect(source.api.canRetryInitialLoad.value).toBe(true)
    expect(source.api.items.value).toHaveLength(0)

    await source.api.retryInitialLoad()
    await source.flush()

    expect(resolve).toHaveBeenCalledTimes(2)
    expect(source.api.errorMessage.value).toBeNull()
    expect(source.api.items.value).toHaveLength(25)

    source.unmount()
  })

  it('marks exhausted boundary reloads as refreshing while the request is in flight', async () => {
    const deferred = createDeferred<VibeResolveResult>()
    const resolve = vi.fn(({ cursor }: VibeResolveParams) => {
      if (resolve.mock.calls.length === 1) {
        expect(cursor).toBe('page-1')
        return Promise.resolve(createPageResult('page-1', {
          itemCount: 25,
          nextPage: null,
        }))
      }

      expect(cursor).toBe('page-1')
      return deferred.promise
    })

    const source = await mountUseDataSource({
      initialCursor: 'page-1',
      resolve,
    })

    await source.flush()
    expect(source.api.hasNextPage.value).toBe(false)

    void source.api.loadNext()
    await source.flush()

    expect(source.api.phase.value).toBe('refreshing')
    expect(source.api.loading.value).toBe(true)

    deferred.resolve(createPageResult('page-1', {
      itemCount: 25,
      nextPage: 'page-2',
    }))
    await source.flush()

    expect(source.api.phase.value).toBe('idle')
    expect(source.api.hasNextPage.value).toBe(true)
    expect(source.api.nextCursor.value).toBe('page-2')

    source.unmount()
  })

  it('removes duplicate ids across loaded pages, restores them in place, and undoes batches in reverse order', async () => {
    const resolve = vi.fn(async ({ cursor }: VibeResolveParams) => {
      if (cursor === 'page-2') {
        return {
          items: [
            createSimpleItem('3'),
            createSimpleItem('4'),
            createSimpleItem('5'),
          ],
          nextPage: null,
          previousPage: 'page-1',
        }
      }

      return {
        items: [
          createSimpleItem('1'),
          createSimpleItem('2'),
          createSimpleItem('3'),
        ],
        nextPage: 'page-2',
        previousPage: null,
      }
    })

    const source = await mountUseDataSource({
      resolve,
      pageSize: 3,
    })

    await source.flush()
    await source.api.prefetchNextPage()
    await source.flush()
    await source.api.commitPendingAppend()
    await source.flush()

    expect(getVisibleIds(source.api.items.value)).toEqual(['1', '2', '3', '3', '4', '5'])

    expect(source.api.remove('3').ids).toEqual(['3'])
    expect(getVisibleIds(source.api.items.value)).toEqual(['1', '2', '4', '5'])

    source.api.remove('2')
    source.api.remove('5')
    expect(getVisibleIds(source.api.items.value)).toEqual(['1', '4'])

    expect(source.api.undo()?.ids).toEqual(['5'])
    expect(getVisibleIds(source.api.items.value)).toEqual(['1', '4', '5'])

    expect(source.api.undo()?.ids).toEqual(['2'])
    expect(getVisibleIds(source.api.items.value)).toEqual(['1', '2', '4', '5'])

    expect(source.api.undo()?.ids).toEqual(['3'])
    expect(getVisibleIds(source.api.items.value)).toEqual(['1', '2', '3', '3', '4', '5'])

    source.api.remove('3')
    expect(getVisibleIds(source.api.items.value)).toEqual(['1', '2', '4', '5'])

    expect(source.api.restore('3').ids).toEqual(['3'])
    expect(getVisibleIds(source.api.items.value)).toEqual(['1', '2', '3', '3', '4', '5'])
    expect(source.api.getRemovedIds()).toEqual([])

    source.unmount()
  })
})
