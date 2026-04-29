import { describe, expect, it, vi } from 'vitest'

import type { VibeResolveParams } from '@/components/viewer-core/useDataSource'

import { mountUseDataSource } from '../helpers/mountUseDataSource'
import { createItems, createPageResult } from '../helpers/useDataSourceTestUtils'

describe('useDataSource exhausted next cursor behavior', () => {
  it('retains an exhausted next cursor and retries it on a later next-page request', async () => {
    let pageTwoLoads = 0
    const resolve = vi.fn(async ({ cursor }: VibeResolveParams) => {
      if (cursor === 'page-2') {
        pageTwoLoads += 1

        return createPageResult(pageTwoLoads === 1 ? 'page-2-empty' : 'page-2', {
          itemCount: pageTwoLoads === 1 ? 0 : 25,
          nextPage: pageTwoLoads === 1 ? null : 'page-3',
          previousPage: 'page-1',
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
    await source.api.loadNext()
    await source.flush()

    expect(resolve).toHaveBeenCalledTimes(2)
    expect(source.api.items.value).toHaveLength(25)
    expect(source.api.nextCursor.value).toBe('page-2')
    expect(source.api.hasNextPage.value).toBe(false)
    expect(source.api.canRefreshExhaustedNextPage.value).toBe(true)

    await source.api.loadNext()
    await source.flush()

    expect(resolve).toHaveBeenCalledTimes(3)
    expect(resolve).toHaveBeenLastCalledWith(expect.objectContaining({
      cursor: 'page-2',
      pageSize: 25,
      signal: expect.any(AbortSignal),
    }))
    expect(source.api.pendingAppendItems.value).toHaveLength(25)

    await source.api.commitPendingAppend()
    await source.flush()

    expect(source.api.items.value).toHaveLength(50)
    expect(source.api.nextCursor.value).toBe('page-3')
    expect(source.api.hasNextPage.value).toBe(true)

    source.unmount()
  })

  it('refreshes an exhausted trailing cursor in place when that page is already loaded', async () => {
    let pageTwoLoads = 0
    const resolve = vi.fn(async ({ cursor }: VibeResolveParams) => {
      if (cursor === 'page-2') {
        pageTwoLoads += 1

        return createPageResult(pageTwoLoads === 1 ? 'page-2' : 'page-2-refreshed', {
          nextPage: pageTwoLoads === 1 ? null : 'page-3',
          previousPage: 'page-1',
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
    await source.api.loadNext()
    await source.flush()
    await source.api.commitPendingAppend()
    await source.flush()

    expect(source.api.items.value).toHaveLength(50)
    expect(source.api.nextCursor.value).toBe('page-2')
    expect(source.api.hasNextPage.value).toBe(false)

    await source.api.loadNext()
    await source.flush()

    expect(resolve).toHaveBeenCalledTimes(3)
    expect(resolve).toHaveBeenLastCalledWith(expect.objectContaining({
      cursor: 'page-2',
      pageSize: 25,
      signal: expect.any(AbortSignal),
    }))
    expect(source.api.nextCursor.value).toBe('page-3')
    expect(source.api.hasNextPage.value).toBe(true)
    expect(source.api.items.value.slice(-25).map((item) => item.id)).toEqual(createItems('page-2-refreshed').map((item) => item.id))

    source.unmount()
  })
})
