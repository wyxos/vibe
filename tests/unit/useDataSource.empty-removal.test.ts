import { describe, expect, it, vi } from 'vitest'

import type { VibeResolveParams, VibeResolveResult } from '@/components/viewer-core/useDataSource'

import { mountUseDataSource } from '../helpers/mountUseDataSource'
import { createDeferred, createPageResult, createSimpleItem } from '../helpers/useDataSourceTestUtils'

describe('useDataSource empty removal recovery', () => {
  it('refreshes an emptied current page when items are removed one at a time', async () => {
    const resolve = vi.fn(async ({ cursor }: VibeResolveParams) => {
      if (resolve.mock.calls.length === 1) {
        expect(cursor).toBe('page-500')
        return createPageResult('page-500', {
          nextPage: 'page-501',
        })
      }

      if (resolve.mock.calls.length === 2) {
        expect(cursor).toBe('page-500')
        return createPageResult('page-500-refill', {
          nextPage: 'page-501',
        })
      }

      throw new Error(`Unexpected cursor ${cursor}`)
    })

    const source = await mountUseDataSource({
      initialCursor: 'page-500',
      resolve,
    })

    await source.flush()
    const ids = source.api.items.value.map((item) => item.id)

    for (const id of ids) {
      source.api.remove(id)
      await source.flush()
    }

    await source.flush()

    expect(resolve.mock.calls.map(([params]) => params.cursor)).toEqual(['page-500', 'page-500'])
    expect(source.api.items.value).toHaveLength(25)
    expect(source.api.items.value.every((item) => item.id.startsWith('page-500-refill'))).toBe(true)
    expect(source.api.phase.value).toBe('idle')

    source.unmount()
  })

  it('waits for caller-owned source removal before refreshing an emptied page', async () => {
    const sourceRemovedIds = new Set<string>()
    const resolve = vi.fn(async () => {
      if (resolve.mock.calls.length === 1) {
        return {
          items: ['a', 'b', 'c'].map(createSimpleItem),
          nextPage: null,
        }
      }

      return {
        items: sourceRemovedIds.size === 3
          ? ['d', 'e', 'f'].map(createSimpleItem)
          : ['a', 'b', 'c'].map(createSimpleItem),
        nextPage: null,
      }
    })

    const source = await mountUseDataSource({
      pageSize: 3,
      resolve,
    })

    await source.flush()

    for (const id of ['a', 'b', 'c']) {
      const result = source.api.remove(id)
      for (const removedId of result.ids) {
        sourceRemovedIds.add(removedId)
      }
      await source.flush()
    }

    await source.flush()

    expect(resolve).toHaveBeenCalledTimes(2)
    expect(source.api.items.value.map((item) => item.id)).toEqual(['d', 'e', 'f'])

    source.unmount()
  })

  it('fills an idle empty page even when regular auto prefetch is disabled', async () => {
    const resolve = vi.fn(async ({ cursor }: VibeResolveParams) => {
      if (resolve.mock.calls.length === 1) {
        expect(cursor).toBe('page-700')
        return {
          items: ['a', 'b', 'c'].map(createSimpleItem),
          nextPage: 'page-701',
        }
      }

      if (resolve.mock.calls.length === 2) {
        expect(cursor).toBe('page-700')
        return {
          items: [],
          nextPage: 'page-701',
        }
      }

      expect(cursor).toBe('page-701')
      return {
        items: ['d', 'e', 'f'].map(createSimpleItem),
        nextPage: null,
      }
    })

    const source = await mountUseDataSource({
      initialCursor: 'page-700',
      pageSize: 3,
      resolve,
    })

    await source.flush()
    source.api.setAutoPrefetchEnabled(false)
    source.api.remove(source.api.items.value.map((item) => item.id))
    await source.flush()
    await source.flush()

    expect(resolve.mock.calls.map(([params]) => params.cursor)).toEqual(['page-700', 'page-700', 'page-701'])
    expect(source.api.items.value.map((item) => item.id)).toEqual(['d', 'e', 'f'])
    expect(source.api.pendingAppendItems.value).toHaveLength(0)
    expect(source.api.phase.value).toBe('idle')

    source.unmount()
  })

  it('commits an in-flight append when current items are removed before it resolves', async () => {
    const { deferred, resolve, source } = await mountSourceWithInFlightAppend()

    expect(resolve).toHaveBeenCalledTimes(2)
    expect(source.api.loading.value).toBe(true)

    source.api.remove(source.api.items.value.map((item) => item.id))
    await source.flush()

    expect(source.api.items.value).toHaveLength(0)

    deferred.resolve(createPageResult('page-2', {
      nextPage: 'page-3',
      previousPage: 'page-1',
    }))
    await source.flush()

    expect(source.api.items.value).toHaveLength(25)
    expect(source.api.items.value.every((item) => item.id.startsWith('page-2'))).toBe(true)
    expect(source.api.pendingAppendItems.value).toHaveLength(0)
    expect(source.api.nextCursor.value).toBe('page-3')
    expect(source.api.loading.value).toBe(false)
    expect(source.api.phase.value).toBe('idle')

    source.unmount()
  })
})

async function mountSourceWithInFlightAppend() {
  const deferred = createDeferred<VibeResolveResult>()
  const resolve = vi.fn(({ cursor }: VibeResolveParams) => {
    if (cursor === 'page-2') {
      return deferred.promise
    }

    return Promise.resolve(createPageResult('page-1', {
      nextPage: 'page-2',
    }))
  })
  const source = await mountUseDataSource({ resolve })

  await source.flush()
  source.api.setActiveIndex(24)
  await source.flush()

  return { deferred, resolve, source }
}
