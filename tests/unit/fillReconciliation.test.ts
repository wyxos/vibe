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
    preview: { src: `https://example.com/${postId}-preview.jpg`, width: 450, height: 600 },
    width: 900,
    height: 1200,
    items: [],
  }
}

function page(ids: readonly number[], next: VibeCursor): VibePage {
  return { items: ids.map(item), next }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  return {
    promise: new Promise<T>((accept, decline) => {
      resolve = accept
      reject = decline
    }),
    reject,
    resolve,
  }
}

describe('frontend fill removal reconciliation', () => {
  let instance: VibeInstance | null = null
  let target: HTMLDivElement

  beforeEach(() => {
    target = document.createElement('div')
    document.body.append(target)
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      callback(0)
      return 1
    }))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(500)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(500)
  })

  afterEach(() => {
    instance?.destroy()
    target.remove()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  async function mountUnderfilled(
    loadPage: (request: { cursor: VibeCursor, signal: AbortSignal }) => Promise<VibePage>,
  ): Promise<void> {
    instance = createVibe({
      fill: { strategy: 'frontend', delayStepMs: 0 },
      infiniteScroll: false,
      loadPage,
      removalReconciliation: { pageSize: 2 },
      target,
    })
    await instance.mount()
    await instance.loadNext()
  }

  it('reconciles once before numeric fill without consuming its forward-page target', async () => {
    const requests: VibeCursor[] = []
    const phases: string[] = []
    let filling = false
    const loadPage = async ({ cursor }: { cursor: VibeCursor }) => {
      requests.push(cursor)
      if (filling) phases.push(instance!.getState().fill.status)
      if (cursor === null) return page([1, 2], 'p2')
      if (!filling && cursor === 'p2') return page([3], 'p3')
      if (cursor === 'p2') return page([3, 4], 'p3')
      if (cursor === 'p3') return page([5], 'p4')
      return page([6, 7], 'p5')
    }
    await mountUnderfilled(loadPage)
    requests.length = 0
    filling = true

    await instance!.fill({ pages: 2 })

    expect(requests).toEqual(['p2', 'p3', 'p4'])
    expect(phases).toEqual(['restoring', 'filling', 'filling'])
    expect(instance!.getState()).toMatchObject({
      fill: { completedPages: 2, received: 3, status: 'complete' },
      next: 'p5',
    })

    requests.length = 0
    await instance!.fill({ pages: 1 })
    expect(requests).toEqual(['p3', 'p4', 'p5'])
  })

  it('reconciles once before fill-to-end and follows the refreshed cursor to null', async () => {
    const requests: VibeCursor[] = []
    let filling = false
    const loadPage = async ({ cursor }: { cursor: VibeCursor }) => {
      requests.push(cursor)
      if (cursor === null) return page([1, 2], 'p2')
      if (!filling && cursor === 'p2') return page([3], 'p3')
      if (cursor === 'p2') return page([3, 4], 'p3')
      if (cursor === 'p3') return page([5, 6], 'p4')
      return page([7, 8], null)
    }
    await mountUnderfilled(loadPage)
    requests.length = 0
    filling = true

    await instance!.fill({ until: 'end' })

    expect(requests).toEqual(['p2', 'p3', 'p4'])
    expect(instance!.getState()).toMatchObject({
      fill: { completedPages: 2, status: 'complete' },
      next: null,
    })
  })

  it('does not reconcile a newly short page when a paused fill resumes', async () => {
    const forward = deferred<VibePage>()
    const requests: VibeCursor[] = []
    let filling = false
    const loadPage = async ({ cursor }: { cursor: VibeCursor }) => {
      requests.push(cursor)
      if (cursor === null) return page([1, 2], 'p2')
      if (!filling && cursor === 'p2') return page([3], 'p3')
      if (cursor === 'p2') return page([3, 4], 'p3')
      if (cursor === 'p3') return forward.promise
      return page([6, 7], 'p5')
    }
    await mountUnderfilled(loadPage)
    requests.length = 0
    filling = true

    const fill = instance!.fill({ pages: 2 })
    await flushPromises()
    instance!.setLoadMoreLocked(true)
    forward.resolve(page([5], 'p4'))
    await fill
    const pausedCycle = instance!.getState().fill.cycleId
    expect(instance!.getState().fill).toMatchObject({
      completedPages: 1,
      received: 1,
      status: 'paused',
      target: { pages: 2 },
    })

    instance!.setLoadMoreLocked(false)
    await flushPromises()
    expect(requests).toEqual(['p2', 'p3', 'p4'])
    expect(instance!.getState().fill).toMatchObject({
      completedPages: 2,
      cycleId: pausedCycle,
      received: 3,
      status: 'complete',
      target: { pages: 2 },
    })
  })

  it('resumes a failed multi-page replay exactly once before retrying Fill', async () => {
    const requests: VibeCursor[] = []
    let filling = false
    let failed = false
    const loadPage = async ({ cursor }: { cursor: VibeCursor }) => {
      requests.push(cursor)
      if (cursor === null) return page([1, 2], 'p2')
      if (!filling && cursor === 'p2') return page([3], 'p3')
      if (!filling && cursor === 'p3') return page([4, 5], 'p4')
      if (cursor === 'p2') return page([3, 30], 'p3')
      if (cursor === 'p3' && !failed) {
        failed = true
        throw new Error('Replay interrupted')
      }
      if (cursor === 'p3') return page([4, 5], 'p4')
      return page([6, 7], 'p5')
    }
    await mountUnderfilled(loadPage)
    await instance!.loadNext()
    requests.length = 0
    filling = true

    await expect(instance!.fill({ pages: 1 })).rejects.toThrow('Replay interrupted')
    expect(requests).toEqual(['p2', 'p3'])

    requests.length = 0
    await instance!.fill({ pages: 1 })
    expect(requests).toEqual(['p3', 'p4'])
    expect(instance!.getState().fill).toMatchObject({ completedPages: 1, status: 'complete' })
  })

  it('resumes a cancelled multi-page replay exactly once before retrying Fill', async () => {
    const interrupted = deferred<VibePage>()
    const requests: VibeCursor[] = []
    let filling = false
    let cancelled = false
    const loadPage = async ({ cursor, signal }: { cursor: VibeCursor, signal: AbortSignal }) => {
      requests.push(cursor)
      if (cursor === null) return page([1, 2], 'p2')
      if (!filling && cursor === 'p2') return page([3], 'p3')
      if (!filling && cursor === 'p3') return page([4, 5], 'p4')
      if (cursor === 'p2') return page([3, 30], 'p3')
      if (cursor === 'p3' && !cancelled) {
        signal.addEventListener('abort', () => {
          cancelled = true
          interrupted.reject(new DOMException('Aborted', 'AbortError'))
        }, { once: true })
        return interrupted.promise
      }
      if (cursor === 'p3') return page([4, 5], 'p4')
      return page([6, 7], 'p5')
    }
    await mountUnderfilled(loadPage)
    await instance!.loadNext()
    requests.length = 0
    filling = true

    const fill = instance!.fill({ pages: 1 })
    await flushPromises()
    await instance!.cancelFill()
    await fill
    expect(requests).toEqual(['p2', 'p3'])

    requests.length = 0
    await instance!.fill({ pages: 1 })
    expect(requests).toEqual(['p3', 'p4'])
    expect(instance!.getState().fill).toMatchObject({ completedPages: 1, status: 'complete' })
  })

  it.each(['error', 'cancel'] as const)(
    'lets ordinary loadNext resume a %s Fill reconciliation',
    async (failure) => {
      const interrupted = deferred<VibePage>()
      const requests: VibeCursor[] = []
      let filling = false
      let interruptedOnce = false
      const loadPage = async ({ cursor, signal }: { cursor: VibeCursor, signal: AbortSignal }) => {
        requests.push(cursor)
        if (cursor === null) return page([1, 2], 'p2')
        if (!filling && cursor === 'p2') return page([3], 'p3')
        if (!filling && cursor === 'p3') return page([4, 5], 'p4')
        if (cursor === 'p2') return page([3, 30], 'p3')
        if (cursor === 'p3' && !interruptedOnce) {
          interruptedOnce = true
          if (failure === 'error') throw new Error('Replay interrupted')
          signal.addEventListener('abort', () => {
            interrupted.reject(new DOMException('Aborted', 'AbortError'))
          }, { once: true })
          return interrupted.promise
        }
        if (cursor === 'p3') return page([4, 5], 'p4')
        return page([6, 7], 'p5')
      }
      await mountUnderfilled(loadPage)
      await instance!.loadNext()
      requests.length = 0
      filling = true

      if (failure === 'error') {
        await expect(instance!.fill({ pages: 1 })).rejects.toThrow('Replay interrupted')
      } else {
        const fill = instance!.fill({ pages: 1 })
        await flushPromises()
        await instance!.cancelFill()
        await fill
      }

      requests.length = 0
      await instance!.loadNext()
      expect(requests).toEqual(['p3', 'p4'])
      expect(instance!.getState().next).toBe('p5')
    },
  )

  it('uses frontend-autofill page records when explicit Fill reconciles', async () => {
    const requests: VibeCursor[] = []
    const loadPage = async ({ cursor }: { cursor: VibeCursor }) => {
      requests.push(cursor)
      if (cursor === null) return page([1, 2], 'p2')
      if (cursor === 'p2') return page([3], 'p3')
      if (cursor === 'p3') return page([4, 5], 'p4')
      return page([6, 7], 'p5')
    }
    instance = createVibe({
      autofill: {
        delayMaxMs: 0,
        delayStepMs: 0,
        maxAdditionalPages: 'unlimited',
        pageSize: 4,
        strategy: 'frontend',
      },
      fill: { strategy: 'frontend', delayStepMs: 0 },
      infiniteScroll: false,
      loadPage,
      removalReconciliation: { pageSize: 2 },
      target,
    })
    await instance.mount()
    expect(requests).toEqual([null, 'p2', 'p3'])
    requests.length = 0

    await instance.fill({ pages: 1 })
    expect(requests).toEqual(['p2', 'p3', 'p4'])
    expect(instance.getState().fill.completedPages).toBe(1)
  })

  it.each([
    [{ pages: 2 } as const, 'exhausted'],
    [{ until: 'end' } as const, 'complete'],
  ] as const)('does not issue a forward request when replay refreshes next to null', async (
    fillTarget,
    expectedStatus,
  ) => {
    const requests: VibeCursor[] = []
    let filling = false
    const loadPage = async ({ cursor }: { cursor: VibeCursor }) => {
      requests.push(cursor)
      if (cursor === null) return page([1, 2], 'p2')
      if (!filling) return page([3], 'p3')
      return page([3, 4], null)
    }
    await mountUnderfilled(loadPage)
    requests.length = 0
    filling = true

    await instance!.fill(fillTarget)
    expect(requests).toEqual(['p2'])
    expect(instance!.getState().fill).toMatchObject({
      completedPages: 0,
      status: expectedStatus,
    })
    expect(instance!.getState().next).toBeNull()
  })

  it('preserves reconciliation delay and status cadence across lock and resume', async () => {
    vi.useFakeTimers()
    const requests: VibeCursor[] = []
    const requestStatuses: string[] = []
    let filling = false
    const loadPage = async ({ cursor }: { cursor: VibeCursor }) => {
      requests.push(cursor)
      if (filling) requestStatuses.push(instance!.getState().fill.status)
      if (cursor === null) return page([1, 2], 'p2')
      if (cursor === 'p2') return page([3], 'p3')
      if (cursor === 'p3') return page([4, 5], 'p4')
      return page([6, 7], 'p5')
    }
    instance = createVibe({
      autofill: {
        delayMaxMs: 1_000,
        delayStepMs: 1_000,
        maxAdditionalPages: 0,
        pageSize: 2,
        strategy: 'frontend',
      },
      fill: { strategy: 'frontend', delayStepMs: 0 },
      infiniteScroll: false,
      loadPage,
      removalReconciliation: { pageSize: 2 },
      target,
    })
    await instance.mount()
    await instance.loadNext()
    await instance.loadNext()
    requests.length = 0
    filling = true

    const fill = instance.fill({ pages: 1 })
    await flushPromises()
    expect(instance.getState().fill).toMatchObject({
      delayRemainingMs: 1_000,
      status: 'restoring',
    })
    instance.setLoadMoreLocked(true)
    await vi.advanceTimersByTimeAsync(1_000)
    await fill
    expect(instance.getState().fill).toMatchObject({
      completedPages: 0,
      status: 'paused',
      target: { pages: 1 },
    })

    instance.setLoadMoreLocked(false)
    await flushPromises()
    expect(instance.getState().fill).toMatchObject({
      delayRemainingMs: 1_000,
      status: 'restoring',
      target: { pages: 1 },
    })
    await vi.advanceTimersByTimeAsync(1_000)
    await flushPromises()

    expect(requests).toEqual(['p2', 'p3', 'p4'])
    expect(requestStatuses).toEqual(['restoring', 'restoring', 'filling'])
    expect(instance.getState().fill).toMatchObject({
      completedPages: 1,
      status: 'complete',
      target: { pages: 1 },
    })
  })

  it('preserves feed state and stops forward fill when reconciliation fails', async () => {
    const requests: VibeCursor[] = []
    let filling = false
    const loadPage = async ({ cursor }: { cursor: VibeCursor }) => {
      requests.push(cursor)
      if (cursor === null) return page([1, 2], 'p2')
      if (!filling && cursor === 'p2') return page([3], 'p3')
      throw new Error('Replay unavailable')
    }
    await mountUnderfilled(loadPage)
    requests.length = 0
    filling = true

    await expect(instance!.fill({ pages: 2 })).rejects.toThrow('Replay unavailable')

    expect(requests).toEqual(['p2'])
    expect(instance!.getState()).toMatchObject({
      fill: { status: 'error' },
      next: 'p3',
    })
    expect(instance!.getState().items.map(({ postId }) => postId)).toEqual([1, 2, 3])
  })

  it('cancels reconciliation without starting a forward request', async () => {
    const replay = deferred<VibePage>()
    const requests: VibeCursor[] = []
    let filling = false
    const loadPage = async ({ cursor, signal }: { cursor: VibeCursor, signal: AbortSignal }) => {
      requests.push(cursor)
      if (cursor === null) return page([1, 2], 'p2')
      if (!filling && cursor === 'p2') return page([3], 'p3')
      signal.addEventListener('abort', () => {
        replay.reject(new DOMException('Aborted', 'AbortError'))
      }, { once: true })
      return replay.promise
    }
    await mountUnderfilled(loadPage)
    requests.length = 0
    filling = true

    const fill = instance!.fill({ until: 'end' })
    await flushPromises()
    expect(instance!.getState().fill.status).toBe('restoring')
    await instance!.cancelFill()
    await fill

    expect(requests).toEqual(['p2'])
    expect(instance!.getState()).toMatchObject({
      fill: { status: 'cancelled' },
      next: 'p3',
    })
  })
})
