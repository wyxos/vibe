import { describe, expect, it, vi } from 'vitest'

import type { VibeResolveParams, VibeResolveResult } from '@/components/viewer-core/useDataSource'
import type { VibeViewerItem } from '@/components/viewer'

import { mountUseDataSource } from '../helpers/mountUseDataSource'

describe('useDataSource', () => {
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
    expect(resolve).toHaveBeenLastCalledWith({
      cursor: 'page-2',
      pageSize: 25,
    })

    deferred.resolve(createPageResult('page-2'))
    await source.flush()

    expect(source.api.items.value).toHaveLength(25)
    expect(source.api.pendingAppendItems.value).toHaveLength(25)

    await source.api.commitPendingAppend()
    await source.flush()

    expect(source.api.items.value).toHaveLength(50)
    expect(source.api.pendingAppendItems.value).toHaveLength(0)

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
    expect(resolve).toHaveBeenLastCalledWith({
      cursor: 'page-9',
      pageSize: 25,
    })
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

function createPageResult(
  pageLabel: string,
  options: {
    nextPage?: string | null
    previousPage?: string | null
  } = {},
): VibeResolveResult {
  return {
    items: createItems(pageLabel),
    nextPage: options.nextPage ?? null,
    previousPage: options.previousPage,
  }
}

function createItems(prefix: string): VibeViewerItem[] {
  return Array.from({ length: 25 }, (_, index) => ({
    id: `${prefix}-item-${index + 1}`,
    type: index % 5 === 0 ? 'video' : 'image',
    title: `${prefix} item ${index + 1}`,
    url: `https://example.com/${prefix}-item-${index + 1}.jpg`,
    width: 1_920,
    height: 1_080,
    preview: {
      url: `https://example.com/${prefix}-item-${index + 1}-preview.jpg`,
      width: 320,
      height: 180,
    },
  }))
}

function createSimpleItem(id: string): VibeViewerItem {
  return {
    id,
    type: 'image',
    title: `Item ${id}`,
    url: `https://example.com/${id}.jpg`,
    width: 1_920,
    height: 1_080,
    preview: {
      url: `https://example.com/${id}-preview.jpg`,
      width: 320,
      height: 180,
    },
  }
}

function getVisibleIds(items: VibeViewerItem[]) {
  return items.map((item) => item.id)
}

function createDeferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void

  const promise = new Promise<T>((innerResolve, innerReject) => {
    resolve = innerResolve
    reject = innerReject
  })

  return {
    promise,
    reject,
    resolve,
  }
}
