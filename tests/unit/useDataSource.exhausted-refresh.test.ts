import { describe, expect, it, vi } from 'vitest'

import type { VibeResolveParams } from '@/components/viewer-core/useDataSource'

import { mountUseDataSource } from '../helpers/mountUseDataSource'
import { createPageResult } from '../helpers/useDataSourceTestUtils'

describe('useDataSource exhausted page refresh', () => {
  it('refreshes the exhausted trailing page when returning to the bottom', async () => {
    const resolve = vi.fn(async ({ cursor }: VibeResolveParams) => {
      if (resolve.mock.calls.length === 1) {
        return createPageResult('page-1', {
          nextPage: null,
        })
      }

      if (cursor === 'page-2') {
        return createPageResult('page-2', {
          nextPage: 'page-3',
          previousPage: 'page-1',
        })
      }

      return createPageResult('page-1', {
        nextPage: 'page-2',
      })
    })

    const source = await mountUseDataSource({
      initialCursor: 'page-1',
      resolve,
    })

    await source.flush()
    expect(source.api.hasNextPage.value).toBe(false)
    expect(source.api.canRefreshExhaustedNextPage.value).toBe(true)

    source.api.setActiveIndex(10)
    await source.flush()
    source.api.setActiveIndex(24)
    await source.flush()

    expect(resolve.mock.calls.map(([params]) => params.cursor)).toEqual(['page-1', 'page-1', 'page-2'])
    expect(source.api.pendingAppendItems.value).toHaveLength(25)

    source.unmount()
  })

  it('refreshes the exhausted trailing page before filling to end', async () => {
    const resolve = vi.fn(async ({ cursor }: VibeResolveParams) => {
      if (resolve.mock.calls.length === 1) {
        return createPageResult('page-1', {
          nextPage: null,
        })
      }

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

      return createPageResult('page-1', {
        nextPage: 'page-2',
      })
    })

    const source = await mountUseDataSource({
      fillDelayMs: 0,
      fillDelayStepMs: 0,
      initialCursor: 'page-1',
      resolve,
    })

    await source.flush()
    expect(source.api.hasNextPage.value).toBe(false)

    await source.api.fillUntilEnd()
    await source.flush()

    expect(resolve.mock.calls.map(([params]) => params.cursor)).toEqual(['page-1', 'page-1', 'page-2', 'page-3'])
    expect(source.api.items.value).toHaveLength(75)
    expect(source.api.hasNextPage.value).toBe(false)

    source.unmount()
  })
})
