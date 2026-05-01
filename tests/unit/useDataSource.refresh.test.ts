import { afterEach, describe, expect, it, vi } from 'vitest'

import type { VibeResolveParams } from '@/components/viewer-core/useDataSource'

import { mountUseDataSource } from '../helpers/mountUseDataSource'
import { createItems, createPageResult, createSimpleItem, getVisibleIds } from '../helpers/useDataSourceTestUtils'

describe('useDataSource refresh behavior', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('reloads the current trailing cursor before advancing to the next cursor', async () => {
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
    expect(source.api.items.value).toHaveLength(45)
    expect(getVisibleIds(source.api.items.value).slice(0, 5)).toEqual([
      'page-1-item-6',
      'page-1-item-7',
      'page-1-item-8',
      'page-1-item-9',
      'page-1-item-10',
    ])
    expect(getVisibleIds(source.api.items.value).slice(20, 25)).toEqual([
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

  it('preserves existing non-removed items when a refreshed page omits them', async () => {
    const resolve = vi.fn(async ({ cursor }: VibeResolveParams) => {
      if (cursor === 'page-5') {
        return {
          items: [
            createSimpleItem('a'),
            createSimpleItem('d'),
            createSimpleItem('e'),
            createSimpleItem('f'),
          ],
          nextPage: 'page-6',
          previousPage: null,
        }
      }

      return {
        items: [
          createSimpleItem('a'),
          createSimpleItem('b'),
          createSimpleItem('c'),
          createSimpleItem('d'),
        ],
        nextPage: 'page-6',
        previousPage: null,
      }
    })

    const source = await mountUseDataSource({
      initialCursor: 'page-5',
      initialState: {
        activeIndex: 0,
        cursor: 'page-5',
        items: [
          createSimpleItem('a'),
          createSimpleItem('b'),
          createSimpleItem('c'),
          createSimpleItem('d'),
        ],
        nextCursor: 'page-6',
      },
      pageSize: 4,
      resolve,
    })

    await source.flush()

    expect(source.api.remove('c').ids).toEqual(['c'])
    await source.flush()

    await source.api.prefetchNextPage()
    await source.flush()

    expect(resolve).toHaveBeenCalledTimes(1)
    expect(resolve).toHaveBeenLastCalledWith(expect.objectContaining({
      cursor: 'page-5',
      pageSize: 4,
      signal: expect.any(AbortSignal),
    }))
    expect(getVisibleIds(source.api.items.value)).toEqual(['a', 'b', 'd', 'e', 'f'])

    source.unmount()
  })

  it('inserts refreshed trailing items without dropping the existing page contents', async () => {
    let pageThreeLoads = 0
    const resolve = vi.fn(async ({ cursor }: VibeResolveParams) => {
      if (cursor === 'page-2') {
        return createPageResult('page-2', {
          nextPage: 'page-3',
          previousPage: 'page-1',
        })
      }

      if (cursor === 'page-3') {
        pageThreeLoads += 1

        return createPageResult(pageThreeLoads === 1 ? 'page-3' : 'page-3-refilled', {
          nextPage: 'page-4',
          previousPage: 'page-2',
        })
      }

      return createPageResult('page-1', {
        nextPage: 'page-2',
      })
    })

    const source = await mountUseDataSource({
      resolve,
    })

    await source.flush()
    await source.api.prefetchNextPage()
    await source.flush()
    await source.api.commitPendingAppend()
    await source.flush()
    await source.api.prefetchNextPage()
    await source.flush()
    await source.api.commitPendingAppend()
    await source.flush()

    const idsBeforeRemoval = getVisibleIds(source.api.items.value)
    expect(idsBeforeRemoval).toHaveLength(75)

    const removedTrailingIds = idsBeforeRemoval.slice(50, 55)
    expect(source.api.remove(removedTrailingIds).ids).toEqual(removedTrailingIds)
    await source.flush()

    await source.api.prefetchNextPage()
    await source.flush()

    const idsAfterRefresh = getVisibleIds(source.api.items.value)

    expect(resolve).toHaveBeenLastCalledWith(expect.objectContaining({
      cursor: 'page-3',
      pageSize: 25,
      signal: expect.any(AbortSignal),
    }))
    expect(idsAfterRefresh.slice(0, 50)).toEqual(idsBeforeRemoval.slice(0, 50))
    expect(idsAfterRefresh.slice(50, 53)).toEqual([
      'page-3-item-6',
      'page-3-item-7',
      'page-3-item-8',
    ])
    expect(idsAfterRefresh.slice(70, 73)).toEqual([
      'page-3-refilled-item-1',
      'page-3-refilled-item-2',
      'page-3-refilled-item-3',
    ])
    expect(idsAfterRefresh).toHaveLength(95)

    source.unmount()
  })

  it('starts filling from the next cursor only when refresh insertion still leaves the trailing page underfilled', async () => {
    let rootPageLoads = 0
    const resolve = vi.fn(async ({ cursor }: VibeResolveParams) => {
      if (cursor === 'page-2') {
        return createPageResult('page-2', {
          itemCount: 20,
          nextPage: 'page-3',
          previousPage: 'page-1',
        })
      }

      rootPageLoads += 1

      return createPageResult(rootPageLoads === 1 ? 'page-1' : 'page-1-refilled', {
        itemCount: rootPageLoads === 1 ? 20 : 4,
        nextPage: 'page-2',
      })
    })

    const source = await mountUseDataSource({
      fillDelayMs: 0,
      fillDelayStepMs: 0,
      pageSize: 20,
      resolve,
    })

    await source.flush()

    const removedTrailingIds = createItems('page-1', 20).slice(0, 6).map((item) => item.id)
    expect(source.api.remove(removedTrailingIds).ids).toEqual(removedTrailingIds)
    await source.flush()

    expect(source.api.items.value).toHaveLength(14)

    await source.api.prefetchNextPage()
    await source.flush()

    expect(resolve).toHaveBeenCalledTimes(3)
    expect(resolve.mock.calls.map(([params]) => params.cursor)).toEqual([
      null,
      null,
      'page-2',
    ])
    expect(source.api.items.value).toHaveLength(18)
    expect(getVisibleIds(source.api.items.value).slice(0, 4)).toEqual([
      'page-1-item-7',
      'page-1-item-8',
      'page-1-item-9',
      'page-1-item-10',
    ])
    expect(getVisibleIds(source.api.items.value).slice(-4)).toEqual([
      'page-1-refilled-item-1',
      'page-1-refilled-item-2',
      'page-1-refilled-item-3',
      'page-1-refilled-item-4',
    ])
    expect(source.api.pendingAppendItems.value).toHaveLength(20)
    expect(getVisibleIds(source.api.pendingAppendItems.value).slice(0, 4)).toEqual([
      'page-2-item-1',
      'page-2-item-2',
      'page-2-item-3',
      'page-2-item-4',
    ])

    source.unmount()
  })

  it('reloads the current leading cursor before prepending a previous cursor', async () => {
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
    expect(source.api.items.value).toHaveLength(45)
    expect(getVisibleIds(source.api.items.value).slice(0, 5)).toEqual([
      'page-2-item-6',
      'page-2-item-7',
      'page-2-item-8',
      'page-2-item-9',
      'page-2-item-10',
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

  it('resumes previous-page loading from the refilled leading edge after a feed is emptied by removal', async () => {
    let pageTenLoads = 0
    let pageElevenLoads = 0
    const resolve = vi.fn(async ({ cursor }: VibeResolveParams) => {
      if (cursor === 'page-10') {
        pageTenLoads += 1

        return createPageResult(pageTenLoads === 1 ? 'page-10' : 'page-10-refilled', {
          nextPage: 'page-11',
          previousPage: 'page-9',
        })
      }

      if (cursor === 'page-11') {
        pageElevenLoads += 1

        return createPageResult(pageElevenLoads === 1 ? 'page-11' : 'page-11-refilled', {
          nextPage: 'page-12',
          previousPage: 'page-10',
        })
      }

      return createPageResult('page-10', {
        nextPage: 'page-11',
        previousPage: 'page-9',
      })
    })

    const source = await mountUseDataSource({
      initialCursor: 'page-10',
      resolve,
    })

    await source.flush()
    await source.api.prefetchNextPage()
    await source.flush()
    await source.api.commitPendingAppend()
    await source.flush()

    const removedIds = source.api.items.value.map((item) => item.id)
    expect(source.api.remove(removedIds).ids).toHaveLength(50)
    await source.flush()

    expect(resolve).toHaveBeenCalledTimes(3)
    expect(resolve).toHaveBeenLastCalledWith(expect.objectContaining({
      cursor: 'page-11',
      pageSize: 25,
      signal: expect.any(AbortSignal),
    }))
    expect(source.api.items.value).toHaveLength(25)
    expect(source.api.previousCursor.value).toBe('page-10')
    expect(source.api.nextCursor.value).toBe('page-12')
    expect(source.api.hasPreviousPage.value).toBe(true)
    expect(source.api.hasNextPage.value).toBe(true)
    expect(source.api.currentCursor.value).toBe('page-11')
    expect(getVisibleIds(source.api.items.value).slice(0, 3)).toEqual([
      'page-11-refilled-item-1',
      'page-11-refilled-item-2',
      'page-11-refilled-item-3',
    ])

    await source.api.prefetchPreviousPage()
    await source.flush()

    expect(resolve).toHaveBeenCalledTimes(4)
    expect(resolve).toHaveBeenLastCalledWith(expect.objectContaining({
      cursor: 'page-10',
      pageSize: 25,
      signal: expect.any(AbortSignal),
    }))
    expect(source.api.items.value).toHaveLength(50)
    expect(source.api.currentCursor.value).toBe('page-11')
    expect(source.api.previousCursor.value).toBe('page-9')
    expect(getVisibleIds(source.api.items.value).slice(0, 3)).toEqual([
      'page-10-refilled-item-1',
      'page-10-refilled-item-2',
      'page-10-refilled-item-3',
    ])

    source.unmount()
  })


})
