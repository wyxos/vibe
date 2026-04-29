import { describe, expect, it, vi } from 'vitest'

import type { VibeResolveParams } from '@/components/viewer-core/useDataSource'

import { mountUseDataSource } from '../helpers/mountUseDataSource'
import { createItems, createPageResult, createSimpleItem, getVisibleIds } from '../helpers/useDataSourceTestUtils'

describe('useDataSource refresh behavior', () => {
  it('appends newly discovered refresh items after the existing page content', async () => {
    const resolve = vi.fn(async () => ({
      items: [
        createSimpleItem('a'),
        createSimpleItem('x'),
        createSimpleItem('b'),
        createSimpleItem('y'),
        createSimpleItem('d'),
        createSimpleItem('z'),
      ],
      nextPage: 'page-6',
      previousPage: null,
    }))

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
    expect(getVisibleIds(source.api.items.value)).toEqual(['a', 'b', 'd', 'x', 'y', 'z'])

    source.unmount()
  })

  it('keeps existing page order when refreshed new items arrive interleaved with known items', async () => {
    const resolve = vi.fn(async () => ({
      items: ['1', '2', '3', '4', '11', '6', '12', '8', '9', '10'].map(createSimpleItem),
      nextPage: 'page-6',
      previousPage: null,
    }))

    const source = await mountUseDataSource({
      initialCursor: 'page-5',
      initialState: {
        activeIndex: 0,
        cursor: 'page-5',
        items: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map(createSimpleItem),
        nextCursor: 'page-6',
      },
      pageSize: 10,
      resolve,
    })

    await source.flush()
    expect(source.api.remove(['5', '7']).ids).toEqual(['5', '7'])
    await source.flush()

    await source.api.prefetchNextPage()
    await source.flush()

    expect(resolve).toHaveBeenCalledTimes(1)
    expect(getVisibleIds(source.api.items.value)).toEqual(['1', '2', '3', '4', '6', '8', '9', '10', '11', '12'])

    source.unmount()
  })

  it('continues to the next cursor when an exhausted-page refresh adds no new items', async () => {
    let pageOneLoads = 0
    const resolve = vi.fn(async ({ cursor }: VibeResolveParams) => {
      if (cursor === 'page-2') {
        return createPageResult('page-2', {
          nextPage: 'page-3',
          previousPage: 'page-1',
        })
      }

      pageOneLoads += 1

      return createPageResult('page-1', {
        nextPage: pageOneLoads === 1 ? null : 'page-2',
      })
    })

    const source = await mountUseDataSource({
      initialCursor: 'page-1',
      resolve,
    })

    await source.flush()
    expect(source.api.hasNextPage.value).toBe(false)

    await source.api.loadNext()
    await source.flush()

    expect(resolve.mock.calls.map(([params]) => params.cursor)).toEqual(['page-1', 'page-1', 'page-2'])
    expect(source.api.items.value).toHaveLength(25)
    expect(source.api.pendingAppendItems.value).toHaveLength(25)
    expect(getVisibleIds(source.api.pendingAppendItems.value)).toEqual(createItems('page-2').map((item) => item.id))

    source.unmount()
  })
})
