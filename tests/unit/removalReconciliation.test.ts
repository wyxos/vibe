import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createVibe,
  type VibeCursor,
  type VibeInstance,
  type VibeItem,
  type VibePage,
} from '@/index'

function item(postId: number): VibeItem {
  return {
    postId,
    src: `https://example.com/${postId}.jpg`,
    preview: {
      src: `https://example.com/${postId}-preview.jpg`,
      width: 450,
      height: 600,
    },
    width: 900,
    height: 1200,
    items: [],
  }
}

function ids(from: number, count: number): number[] {
  return Array.from({ length: count }, (_, index) => from + index)
}

function page(itemIds: readonly number[], next: VibeCursor): VibePage {
  return { items: itemIds.map(item), next }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  return {
    promise: new Promise<T>((accept) => { resolve = accept }),
    resolve,
  }
}

describe('capacity-aware removal reconciliation', () => {
  let instance: VibeInstance | null = null
  let target: HTMLDivElement

  beforeEach(() => {
    vi.useFakeTimers()
    target = document.createElement('div')
    document.body.append(target)
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      callback(0)
      return 1
    }))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(500)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(2_000)
  })

  afterEach(() => {
    instance?.destroy()
    target.remove()
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  async function remove(postIds: readonly number[]) {
    const pending = instance!.removeItems(postIds)
    await vi.runAllTimersAsync()
    return pending
  }

  it('loads next directly when every recorded provider page is full', async () => {
    const requests: VibeCursor[] = []
    const pages = new Map<VibeCursor, VibePage>([
      [null, page(ids(1, 20), 'p2')],
      ['p2', page(ids(21, 20), 'p3')],
      ['p3', page(ids(41, 20), 'p4')],
      ['p4', page(ids(61, 20), null)],
    ])
    instance = createVibe({
      infiniteScroll: false,
      loadPage: async ({ cursor }) => {
        requests.push(cursor)
        return pages.get(cursor)!
      },
      removalReconciliation: { pageSize: 20 },
      target,
    })
    await instance.mount()
    await instance.loadNext()
    await instance.loadNext()
    requests.length = 0

    await instance.loadNext()
    expect(requests).toEqual(['p4'])
  })

  it('replays from the earliest underfilled page and appends all new results', async () => {
    const requests: VibeCursor[] = []
    let second = ids(21, 18)
    let third = ids(39, 20)
    const loadPage = async ({ cursor }: { cursor: VibeCursor }) => {
      requests.push(cursor)
      if (cursor === null) return page(ids(1, 20), 'p2')
      if (cursor === 'p2') return page(second, 'p3')
      if (cursor === 'p3') return page(third, 'p4')
      return page(ids(59, 20), null)
    }
    instance = createVibe({
      infiniteScroll: false,
      loadPage,
      removalReconciliation: { pageSize: 20 },
      target,
    })
    await instance.mount()
    await instance.loadNext()
    await instance.loadNext()
    expect(instance.getState().items).toHaveLength(58)

    second = [...ids(21, 15), 101, 102, 103, 104, 105]
    third = ids(36, 20)
    requests.length = 0
    await instance.loadNext()

    expect(requests).toEqual(['p2', 'p3', 'p4'])
    expect(instance.getState().items.map(({ postId }) => postId))
      .toEqual(expect.arrayContaining([101, 102, 103, 104, 105]))
    expect(instance.getState().items.length).toBeGreaterThan(80)
  })

  it('rechecks a page that remains under capacity even when replay finds nothing', async () => {
    const requests: VibeCursor[] = []
    const loadPage = async ({ cursor }: { cursor: VibeCursor }) => {
      requests.push(cursor)
      if (cursor === null) return page(ids(1, 20), 'p2')
      if (cursor === 'p2') return page(ids(21, 18), 'p3')
      if (cursor === 'p3') return page(ids(39, 20), 'p4')
      if (cursor === 'p4') return page(ids(59, 20), 'p5')
      return page(ids(79, 20), null)
    }
    instance = createVibe({
      infiniteScroll: false,
      loadPage,
      removalReconciliation: { pageSize: 20 },
      target,
    })
    await instance.mount()
    await instance.loadNext()
    await instance.loadNext()

    requests.length = 0
    await instance.loadNext()
    expect(requests).toEqual(['p2', 'p3', 'p4'])

    requests.length = 0
    await instance.loadNext()
    expect(requests).toEqual(['p2', 'p3', 'p4', 'p5'])
  })

  it('treats duplicate results as an under-capacity unique contribution', async () => {
    const requests: VibeCursor[] = []
    const loadPage = async ({ cursor }: { cursor: VibeCursor }) => {
      requests.push(cursor)
      if (cursor === null) return page(ids(1, 20), 'p2')
      if (cursor === 'p2') return page([20, ...ids(21, 19)], 'p3')
      return page(ids(40, 20), null)
    }
    instance = createVibe({
      infiniteScroll: false,
      loadPage,
      removalReconciliation: { pageSize: 20 },
      target,
    })
    await instance.mount()
    await instance.loadNext()
    requests.length = 0

    await instance.loadNext()
    expect(requests).toEqual(['p2', 'p3'])
  })

  it('attributes removals to pages and excludes tombstones during replay', async () => {
    const requests: VibeCursor[] = []
    const loadPage = async ({ cursor }: { cursor: VibeCursor }) => {
      requests.push(cursor)
      if (cursor === null) return page(ids(1, 20), 'p2')
      if (cursor === 'p2') return page(ids(21, 20), 'p3')
      if (cursor === 'p3') return page(ids(41, 20), 'p4')
      return page(ids(61, 20), null)
    }
    instance = createVibe({
      infiniteScroll: false,
      loadPage,
      removalReconciliation: { pageSize: 20 },
      target,
    })
    await instance.mount()
    await instance.loadNext()
    await instance.loadNext()
    const removal = await remove([2, 3, 24, 45, 46, 47])

    requests.length = 0
    await instance.loadNext()
    expect(requests).toEqual([null, 'p2', 'p3', 'p4'])
    expect(instance.getState().items.map(({ postId }) => postId))
      .not.toEqual(expect.arrayContaining([2, 3, 24, 45, 46, 47]))

    expect(instance.restoreRemoval(removal)).toBe(true)
    await flushPromises()
    expect(instance.getState().items.map(({ postId }) => postId))
      .toEqual(expect.arrayContaining([2, 3, 24, 45, 46, 47]))
  })

  it('bounds reconciliation to the last five concrete provider pages', async () => {
    const requests: VibeCursor[] = []
    const loadPage = async ({ cursor }: { cursor: VibeCursor }) => {
      requests.push(cursor)
      const pageNumber = cursor === null ? 1 : Number(String(cursor).slice(1))
      return page(ids((pageNumber - 1) * 2 + 1, 2), `p${pageNumber + 1}`)
    }
    instance = createVibe({
      infiniteScroll: false,
      loadPage,
      removalReconciliation: { maxReplayPages: 5, pageSize: 2 },
      target,
    })
    await instance.mount()
    for (let count = 0; count < 6; count += 1) await instance.loadNext()
    await remove([1])
    requests.length = 0

    await instance.loadNext()
    expect(requests).toEqual(['p8'])
  })

  it('records internal frontend-autofill requests as separate pages', async () => {
    const requests: VibeCursor[] = []
    const loadPage = async ({ cursor }: { cursor: VibeCursor }) => {
      requests.push(cursor)
      const offset = cursor === null ? 0 : Number(cursor)
      return page(ids(offset + 1, 2), offset + 2)
    }
    instance = createVibe({
      autofill: {
        delayMaxMs: 0,
        delayStepMs: 0,
        maxAdditionalPages: 'unlimited',
        pageSize: 6,
        strategy: 'frontend',
      },
      infiniteScroll: false,
      loadPage,
      removalReconciliation: { pageSize: 2 },
      target,
    })
    await instance.mount()
    expect(requests).toEqual([null, 2, 4])
    await remove([5])
    requests.length = 0

    await instance.loadNext()
    expect(requests).toEqual([4, 6, 8, 10])
  })

  it('preserves the old cursor and page ledger when replay fails', async () => {
    const requests: VibeCursor[] = []
    let failReplay = false
    const loadPage = async ({ cursor }: { cursor: VibeCursor }) => {
      requests.push(cursor)
      if (failReplay && cursor === 'p2') throw new Error('Replay unavailable')
      if (cursor === null) return page(ids(1, 20), 'p2')
      if (cursor === 'p2') return page(ids(21, 18), 'p3')
      if (cursor === 'p3') return page(ids(39, 20), 'p4')
      return page(ids(59, 20), null)
    }
    instance = createVibe({
      infiniteScroll: false,
      loadPage,
      removalReconciliation: { pageSize: 20 },
      target,
    })
    await instance.mount()
    await instance.loadNext()
    await instance.loadNext()
    failReplay = true
    requests.length = 0

    await instance.loadNext()
    expect(requests).toEqual(['p2'])
    expect(instance.getState().next).toBe('p4')
    expect(instance.getState().nextPageError).toEqual(new Error('Replay unavailable'))

    failReplay = false
    requests.length = 0
    await instance.loadNext()
    expect(requests).toEqual(['p2', 'p3', 'p4'])
  })

  it('coalesces removals made while a reconciliation is in flight', async () => {
    const replay = deferred<VibePage>()
    const requests: VibeCursor[] = []
    let initialLoaded = false
    const loadPage = async ({ cursor }: { cursor: VibeCursor }) => {
      requests.push(cursor)
      if (cursor === null && initialLoaded) return replay.promise
      if (cursor === null) {
        initialLoaded = true
        return page([1, 2], 'p2')
      }
      if (cursor === 'p2') return page([3, 4], 'p3')
      return page([5, 6], null)
    }
    instance = createVibe({
      infiniteScroll: false,
      loadPage,
      removalReconciliation: { pageSize: 2 },
      target,
    })
    await instance.mount()
    await instance.loadNext()
    await remove([1])
    requests.length = 0

    const loading = instance.loadNext()
    await flushPromises()
    await remove([3])
    replay.resolve(page([1, 2], 'p2'))
    await loading

    expect(requests).toEqual([null, 'p2', 'p3'])
    expect(instance.getState().items.map(({ postId }) => postId))
      .not.toEqual(expect.arrayContaining([1, 3]))
  })

  it('reconciles when exact-media removal deletes the top-level item', async () => {
    const requests: VibeCursor[] = []
    const loadPage = async ({ cursor }: { cursor: VibeCursor }) => {
      requests.push(cursor)
      return cursor === null
        ? page([1, 2], 'p2')
        : page([3, 4], null)
    }
    instance = createVibe({
      infiniteScroll: false,
      loadPage,
      removalReconciliation: { pageSize: 2 },
      target,
    })
    await instance.mount()
    const removal = instance.removeMedia({ mediaIndex: 0, postId: 1 })
    requests.length = 0

    await instance.loadNext()
    expect(requests).toEqual([null, 'p2'])
    expect(instance.getState().items.map(({ postId }) => postId)).toEqual([2, 3, 4])
    expect(instance.restoreMediaRemoval(removal!)).toBe(true)
    expect(instance.getState().items.map(({ postId }) => postId)).toEqual([1, 2, 3, 4])
  })

  it('validates the required provider page size', () => {
    expect(() => createVibe({
      initialPage: { items: [item(1)], next: null },
      removalReconciliation: { pageSize: 0 },
      target,
    })).toThrow('Vibe removalReconciliation pageSize must be a positive integer.')
  })
})
