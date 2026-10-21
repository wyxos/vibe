import { flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import { collectFrontendFill, type FrontendFillCollection } from '@/core/fill'
import { VibeFillController } from '@/core/fillController'
import { createInitialRuntimeState } from '@/core/initialRuntimeState'
import type { VibeItem } from '@/types'

const item = (postId: number | string): VibeItem => ({
  postId, src: 'data:,fixture', width: 400, height: 600, items: [],
})

describe('frontend fill incremental collection work', () => {
  it('does not revisit accumulated additions or replay page records on every page', async () => {
    const initialCount = 6_500, pageCount = 50, pageSize = 250
    let initialIdReads = 0
    const initial = Array.from({ length: initialCount }, (_, index) => {
      const value = item(index)
      Object.defineProperty(value, 'postId', {
        enumerable: true,
        get: () => { initialIdReads += 1; return index },
      })
      return value
    })
    const fill = { strategy: 'frontend' as const, delayStepMs: 0 }
    const state = createInitialRuntimeState({
      fill, initialPage: { items: initial, next: 1 }, target: document.createElement('div'),
    }, 'masonry')
    const filteredBatchSizes: number[] = [], pageBatchSizes: number[] = []
    let lastCommittedItems: VibeItem[] | undefined
    const controller = new VibeFillController({
      fill,
      filterItems: (items) => { filteredBatchSizes.push(items.length); return [...items] },
      loadPage: async ({ cursor }) => {
        const page = Number(cursor)
        return {
          items: Array.from({ length: pageSize }, (_, index) => (
            item(initialCount + (page - 1) * pageSize + index)
          )),
          next: page + 1,
        }
      },
      onLastCursor: () => undefined,
      onPages: (pages) => { pageBatchSizes.push(pages.length); lastCommittedItems = state.items },
      state,
    })
    initialIdReads = 0
    await controller.start({ pages: pageCount })

    // The collector seeds its IDs once; each live commit checks the current
    // collection once so concurrent public append/removal operations stay safe.
    expect({ initialIdReads, filteredItems: filteredBatchSizes.reduce((a, b) => a + b, 0),
      pageRecords: pageBatchSizes.reduce((a, b) => a + b, 0) }).toEqual({
      initialIdReads: initialCount * (pageCount + 1),
      filteredItems: pageCount * pageSize,
      pageRecords: pageCount,
    })
    expect(state.items).toBe(lastCommittedItems)
    expect(state.items).toHaveLength(initialCount + pageCount * pageSize)
    expect(state.fill).toMatchObject({ completedPages: pageCount, received: 12_500, status: 'complete' })
    controller.destroy()
  })

  it('preserves cumulative collection callback snapshots and typed duplicate identity', async () => {
    const collections: FrontendFillCollection[] = []
    const loadPage = vi.fn()
      .mockResolvedValueOnce({ items: [item(1), item('1'), item(2), item(2)], next: 2, total: 5 })
      .mockResolvedValueOnce({ items: [item(2), item(3)], next: null })
    const result = await collectFrontendFill({
      existingItems: [item(1)], initialCursor: 1, loadPage,
      onCollection: (collection) => collections.push(collection),
      onDelayChange: () => undefined, onProgress: () => undefined,
      options: { strategy: 'frontend', delayStepMs: 0 },
      signal: new AbortController().signal, target: { until: 'end' },
    })
    expect(collections.map(({ items }) => items.map(({ postId }) => postId)))
      .toEqual([['1', 2], ['1', 2, 3]])
    expect(collections.map(({ pages }) => pages.length)).toEqual([1, 2])
    expect(result).toMatchObject({ completedPages: 2, received: 3, status: 'complete', total: 5 })
    expect(result.pages).toEqual([
      { contributionIds: ['1', 2], cursor: 1, next: 2, returnedIds: [1, '1', 2, 2] },
      { contributionIds: [3], cursor: 2, next: null, returnedIds: [2, 3] },
    ])
  })

  it('does not replace the collection when a page contains only existing IDs', async () => {
    const fill = { strategy: 'frontend' as const, delayStepMs: 0 }
    const state = createInitialRuntimeState({
      fill, initialPage: { items: [item(1)], next: 1 }, target: document.createElement('div'),
    }, 'masonry')
    const initial = state.items
    const onPages = vi.fn()
    const controller = new VibeFillController({ fill,
      loadPage: async () => ({ items: [item(1), item(1)], next: null }),
      onLastCursor: () => undefined, onPages, state })
    await controller.start({ pages: 1 })
    expect(state.items).toBe(initial)
    expect(state.fill).toMatchObject({ completedPages: 1, received: 0, status: 'complete' })
    expect(onPages).toHaveBeenCalledWith([
      { contributionIds: [], cursor: 1, next: null, returnedIds: [1, 1] },
    ])
    controller.destroy()
  })

  it('preserves concurrent appends, updates and in-place removal while a page is pending', async () => {
    const fill = { strategy: 'frontend' as const, delayStepMs: 0 }
    const state = createInitialRuntimeState({
      fill, initialPage: { items: [item(1)], next: 1 }, target: document.createElement('div'),
    }, 'masonry')
    let finish!: (page: { items: VibeItem[], next: null }) => void
    const loadPage = vi.fn()
      .mockResolvedValueOnce({ items: [item(2)], next: 2 })
      .mockReturnValueOnce(new Promise((resolve) => { finish = resolve }))
    const tombstones = new Set<number | string>()
    const onPages = vi.fn()
    const controller = new VibeFillController({ fill, loadPage, state, onPages,
      onLastCursor: () => undefined,
      filterItems: (items) => items.filter(({ postId }) => !tombstones.has(postId)) })
    const filling = controller.start({ pages: 2 })
    await flushPromises()
    // Public exact-media removal can splice the runtime array in place. A
    // public append or update can replace it while the loader is suspended.
    state.items.splice(0, 1)
    tombstones.add(1)
    const updated = { ...item(2), width: 999 }
    const appended = { ...item(3), width: 777 }
    state.items = [updated, appended]
    finish({ items: [item(1), item(2), item(3), item(4)], next: null })
    await filling
    expect(state.items).toEqual([updated, appended, item(4)])
    expect(state.items[0]).toBe(updated)
    expect(state.items[1]).toBe(appended)
    expect(onPages.mock.calls.map(([records]) => records.length)).toEqual([1, 1])
    expect(state.fill).toMatchObject({ completedPages: 2, received: 3, status: 'complete' })
    controller.destroy()
  })

  it('ignores a stale loader result after cancellation and preserves committed pages on retry', async () => {
    const fill = { strategy: 'frontend' as const, delayStepMs: 0 }
    const state = createInitialRuntimeState({
      fill, initialPage: { items: [item(1)], next: 1 }, target: document.createElement('div'),
    }, 'masonry')
    let finish!: (page: { items: VibeItem[], next: number }) => void
    const loadPage = vi.fn()
      .mockResolvedValueOnce({ items: [item(2)], next: 2 })
      .mockReturnValueOnce(new Promise((resolve) => { finish = resolve }))
      .mockResolvedValueOnce({ items: [item(2), item(3)], next: 3 })
    const onPages = vi.fn()
    const controller = new VibeFillController({ fill, loadPage, state, onPages,
      onLastCursor: () => undefined })
    const filling = controller.start({ pages: 2 })
    await flushPromises()
    await controller.cancel()
    const committed = state.items
    finish({ items: [item(99)], next: 99 })
    await filling
    expect(state.items).toBe(committed)
    expect(state.items.map(({ postId }) => postId)).toEqual([1, 2])
    expect(state.next).toBe(2)
    expect(state.fill.status).toBe('cancelled')
    await controller.start({ pages: 1 })
    expect(state.items.map(({ postId }) => postId)).toEqual([1, 2, 3])
    expect(onPages).toHaveBeenCalledTimes(2)
    controller.destroy()
  })
})
