import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createVibe,
  type VibeBackendFillUpdate,
  type VibeFillSessionSnapshot,
  type VibeInstance,
  type VibeItem,
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

function terminalUpdate(
  overrides: Partial<VibeBackendFillUpdate> = {},
): VibeBackendFillUpdate {
  return {
    completedPages: 2,
    feedKey: 'gallery',
    items: [item(2), item(3)],
    lastCursor: 'three',
    next: 'four',
    received: 2,
    sequence: 1,
    sessionId: 'session-1',
    status: 'complete',
    ...overrides,
  } as VibeBackendFillUpdate
}

describe('Vibe fill', () => {
  const instances: VibeInstance[] = []
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
    vi.useRealTimers()
    instances.splice(0).forEach((instance) => instance.destroy())
    target.remove()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  function track(instance: VibeInstance): VibeInstance {
    instances.push(instance)
    return instance
  }

  it('loads exactly the requested number of additional frontend pages', async () => {
    const loadPage = vi.fn()
      .mockResolvedValueOnce({ items: [item(2)], next: 'three' })
      .mockResolvedValueOnce({ items: [item(3)], next: 'four' })
    const instance = track(createVibe({
      fill: { strategy: 'frontend', delayStepMs: 0 },
      initialPage: { items: [item(1)], next: 'two' },
      loadPage,
      target,
    }))

    await instance.mount()
    await instance.fill({ pages: 2 })

    expect(loadPage.mock.calls.map(([request]) => request.cursor))
      .toEqual(['two', 'three'])
    expect(instance.getState().items.map(({ postId }) => postId)).toEqual([1, 2, 3])
    expect(instance.getState().fill).toMatchObject({
      completedPages: 2,
      received: 2,
      status: 'complete',
      strategy: 'frontend',
      target: { pages: 2 },
    })
    expect(instance.getState().next).toBe('four')
  })

  it('continues repeated page-count fills from the current cursor', async () => {
    const loadPage = vi.fn(({ cursor }: { cursor: number }) => Promise.resolve({
      items: [item(cursor)],
      next: cursor + 1,
    }))
    const instance = track(createVibe({
      fill: { strategy: 'frontend', delayStepMs: 0 },
      initialPage: {
        items: [item(1), item(2), item(3), item(4)],
        next: 5,
      },
      loadPage,
      target,
    }))

    await instance.mount()
    await instance.fill({ pages: 4 })
    expect(loadPage.mock.calls.map(([request]) => request.cursor))
      .toEqual([5, 6, 7, 8])
    expect(instance.getState().next).toBe(9)

    await instance.fill({ pages: 4 })
    expect(loadPage.mock.calls.map(([request]) => request.cursor))
      .toEqual([5, 6, 7, 8, 9, 10, 11, 12])
    expect(instance.getState()).toMatchObject({
      fill: { completedPages: 4, received: 4, status: 'complete' },
      next: 13,
    })
  })

  it('buffers frontend pages and commits one batch only after filling completes', async () => {
    let resolveSecond!: (page: { items: VibeItem[]; next: string }) => void
    const loadPage = vi.fn()
      .mockResolvedValueOnce({ items: [item(2)], next: 'three' })
      .mockImplementationOnce(() => new Promise((resolve) => {
        resolveSecond = resolve
      }))
    const instance = track(createVibe({
      fill: { strategy: 'frontend', delayStepMs: 0 },
      initialPage: { items: [item(1)], next: 'two' },
      loadPage,
      target,
    }))
    await instance.mount()

    const fill = instance.fill({ pages: 2 })
    await flushPromises()

    expect(instance.getState().fill.completedPages).toBe(1)
    expect(instance.getState().items.map(({ postId }) => postId)).toEqual([1])

    resolveSecond({ items: [item(3)], next: 'four' })
    await fill
    expect(instance.getState().items.map(({ postId }) => postId)).toEqual([1, 2, 3])
  })

  it('waits progressively between frontend fill requests', async () => {
    vi.useFakeTimers()
    const loadPage = vi.fn()
      .mockResolvedValueOnce({ items: [item(2)], next: 'three' })
      .mockResolvedValueOnce({ items: [item(3)], next: 'four' })
    const instance = track(createVibe({
      fill: { strategy: 'frontend' },
      initialPage: { items: [item(1)], next: 'two' },
      loadPage,
      target,
    }))
    await instance.mount()

    const filling = instance.fill({ pages: 2 })
    await flushPromises()
    expect(loadPage).toHaveBeenCalledOnce()
    expect(instance.getState().fill.delayRemainingMs).toBe(2_000)

    await vi.advanceTimersByTimeAsync(1_999)
    expect(loadPage).toHaveBeenCalledOnce()
    await vi.advanceTimersByTimeAsync(1)
    await filling

    expect(loadPage).toHaveBeenCalledTimes(2)
    expect(instance.getState().fill).toMatchObject({
      delayRemainingMs: null,
      nextRequestAt: null,
      status: 'complete',
    })
  })

  it('resumes a page-boundary-paused frontend fill on unlock', async () => {
    let resolveFirst!: (page: { items: VibeItem[]; next: string }) => void
    const loadPage = vi.fn()
      .mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve }))
      .mockResolvedValueOnce({ items: [item(3)], next: 'four' })
    const instance = track(createVibe({
      fill: { strategy: 'frontend', delayStepMs: 0 },
      initialPage: { items: [item(1)], next: 'two' },
      loadPage,
      target,
    }))
    await instance.mount()

    const filling = instance.fill({ pages: 2 })
    await flushPromises()
    instance.setLoadMoreLocked(true)
    resolveFirst({ items: [item(2)], next: 'three' })
    await filling

    expect(instance.getState()).toMatchObject({
      fill: { completedPages: 1, status: 'paused' },
      next: 'three',
    })
    instance.setLoadMoreLocked(false)
    await flushPromises()

    expect(loadPage.mock.calls.map(([request]) => request.cursor)).toEqual(['two', 'three'])
    expect(instance.getState().items.map(({ postId }) => postId)).toEqual([1, 2, 3])
  })

  it('fills frontend pages until the source reaches its end', async () => {
    const loadPage = vi.fn()
      .mockResolvedValueOnce({ items: [item(2)], next: 'three' })
      .mockResolvedValueOnce({ items: [item(3)], next: null })
    const instance = track(createVibe({
      fill: { strategy: 'frontend', delayStepMs: 0 },
      initialPage: { items: [item(1)], next: 'two' },
      loadPage,
      target,
    }))
    await instance.mount()

    await instance.fill({ until: 'end' })

    expect(loadPage).toHaveBeenCalledTimes(2)
    expect(instance.getState().fill).toMatchObject({
      completedPages: 2,
      status: 'complete',
      target: { until: 'end' },
    })
    expect(instance.getState().next).toBeNull()
  })

  it('marks a page-count fill exhausted when the source ends early', async () => {
    const instance = track(createVibe({
      fill: { strategy: 'frontend', delayStepMs: 0 },
      initialPage: { items: [item(1)], next: 'two' },
      loadPage: vi.fn().mockResolvedValue({ items: [item(2)], next: null }),
      target,
    }))
    await instance.mount()

    await instance.fill({ pages: 3 })

    expect(instance.getState().fill).toMatchObject({
      completedPages: 1,
      status: 'exhausted',
    })
    expect(instance.getState().items.map(({ postId }) => postId)).toEqual([1, 2])
  })

  it('cancels frontend fill while preserving completed pages', async () => {
    const loadPage = vi.fn()
      .mockResolvedValueOnce({ items: [item(2)], next: 'three' })
      .mockImplementationOnce(({ signal }: { signal: AbortSignal }) => (
        new Promise((_resolve, reject) => {
          signal.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'))
          })
        })
      ))
    const instance = track(createVibe({
      fill: { strategy: 'frontend', delayStepMs: 0 },
      initialPage: { items: [item(1)], next: 'two' },
      loadPage,
      target,
    }))
    await instance.mount()

    const fill = instance.fill({ pages: 2 })
    await flushPromises()
    await instance.cancelFill()
    await fill

    expect(instance.getState().fill.status).toBe('cancelled')
    expect(instance.getState().items.map(({ postId }) => postId)).toEqual([1, 2])
  })

  it('delegates backend fill and applies only its terminal batch', async () => {
    const onStart = vi.fn().mockResolvedValue({ sessionId: 'session-1' })
    const instance = track(createVibe({
      fill: {
        strategy: 'backend',
        feedKey: 'gallery',
        onCancel: vi.fn(),
        onStart,
      },
      initialPage: { items: [item(1)], next: 'two', total: 10 },
      loadPage: vi.fn(),
      target,
    }))
    await instance.mount()

    await instance.fill({ pages: 2 })

    expect(onStart).toHaveBeenCalledWith(expect.objectContaining({
      feedKey: 'gallery',
      next: 'two',
      target: { pages: 2 },
    }))
    expect(instance.getState().fill.status).toBe('waiting')
    expect(instance.applyFillUpdate({
      completedPages: 1,
      feedKey: 'gallery',
      received: 1,
      sequence: 1,
      sessionId: 'session-1',
      status: 'waiting',
    })).toBe(true)
    expect(instance.getState().items.map(({ postId }) => postId)).toEqual([1])

    expect(instance.applyFillUpdate(terminalUpdate({ sequence: 2 }))).toBe(true)
    expect(instance.getState().items.map(({ postId }) => postId)).toEqual([1, 2, 3])
    expect(instance.getState().next).toBe('four')
    expect(instance.getState().fill.status).toBe('complete')
  })

  it('derives a backend fill countdown from waiting updates', async () => {
    vi.useFakeTimers()
    const instance = track(createVibe({
      fill: {
        strategy: 'backend',
        feedKey: 'gallery',
        onCancel: vi.fn(),
        onStart: vi.fn().mockResolvedValue({ sessionId: 'session-1' }),
      },
      initialPage: { items: [item(1)], next: 'two' },
      loadPage: vi.fn(),
      target,
    }))
    await instance.mount()
    await instance.fill({ pages: 2 })

    expect(instance.applyFillUpdate({
      completedPages: 1,
      feedKey: 'gallery',
      nextRequestAt: Date.now() + 2_000,
      received: 1,
      sequence: 1,
      sessionId: 'session-1',
      status: 'waiting',
    })).toBe(true)
    expect(instance.getState().fill.delayRemainingMs).toBe(2_000)

    await vi.advanceTimersByTimeAsync(1_000)
    expect(instance.getState().fill.delayRemainingMs).toBe(1_000)

    expect(instance.applyFillUpdate(terminalUpdate({ sequence: 2 }))).toBe(true)
    expect(instance.getState().fill.delayRemainingMs).toBeNull()
  })

  it('rejects stale or incomplete backend terminal updates', async () => {
    const instance = track(createVibe({
      fill: {
        strategy: 'backend',
        feedKey: 'gallery',
        onCancel: vi.fn(),
        onStart: vi.fn().mockResolvedValue({ sessionId: 'session-1' }),
      },
      initialPage: { items: [item(1)], next: 'two' },
      loadPage: vi.fn(),
      target,
    }))
    await instance.mount()
    await instance.fill({ pages: 3 })

    expect(instance.applyFillUpdate(terminalUpdate({ completedPages: 2 }))).toBe(false)
    expect(instance.applyFillUpdate({
      completedPages: 1,
      feedKey: 'other',
      received: 1,
      sequence: 1,
      sessionId: 'session-1',
      status: 'waiting',
    })).toBe(false)
    expect(instance.getState().items.map(({ postId }) => postId)).toEqual([1])
  })

  it('cancels a waiting backend fill through the consumer callback', async () => {
    const onCancel = vi.fn()
    const instance = track(createVibe({
      fill: {
        strategy: 'backend',
        feedKey: 'gallery',
        onCancel,
        onStart: vi.fn().mockResolvedValue({ sessionId: 'session-1' }),
      },
      initialPage: { items: [item(1)], next: 'two' },
      loadPage: vi.fn(),
      target,
    }))
    await instance.mount()
    await instance.fill({ until: 'end' })

    await instance.cancelFill()

    expect(onCancel).toHaveBeenCalledWith(expect.objectContaining({
      feedKey: 'gallery',
      sessionId: 'session-1',
    }))
    expect(instance.getState().fill.status).toBe('cancelled')
  })

  it('restores a durable backend fill session and continues from its terminal cursor', async () => {
    const snapshot: VibeFillSessionSnapshot = {
      completedPages: 1,
      cycleId: 'cycle-1',
      feedKey: 'gallery',
      received: 1,
      sequence: 1,
      sessionId: 'session-1',
      status: 'waiting',
      target: { pages: 2 },
    }
    const loadPage = vi.fn().mockResolvedValue({ items: [item(4)], next: null })
    const instance = track(createVibe({
      fill: {
        strategy: 'backend',
        feedKey: 'gallery',
        initialSession: snapshot,
        onCancel: vi.fn(),
        onStart: vi.fn(),
      },
      initialPage: { items: [item(1)], next: 'two' },
      loadPage,
      target,
    }))
    await instance.mount()

    expect(instance.getState().fill).toMatchObject({
      completedPages: 1,
      status: 'waiting',
      target: { pages: 2 },
    })
    expect(instance.applyFillUpdate(terminalUpdate({
      completedPages: 2,
      items: [item(2), item(3)],
      lastCursor: 'three',
      next: 'four',
      sequence: 2,
    }))).toBe(true)

    await instance.loadNext()

    expect(loadPage).toHaveBeenCalledWith(expect.objectContaining({ cursor: 'four' }))
    expect(instance.getState().items.map(({ postId }) => postId)).toEqual([1, 2, 3, 4])
  })

  it('validates fill targets and frontend loader requirements', async () => {
    expect(() => createVibe({
      fill: { strategy: 'frontend', delayStepMs: 0 },
      initialPage: { items: [], next: null },
      target,
    })).toThrow('Vibe frontend fill requires loadPage.')

    const instance = track(createVibe({
      fill: { strategy: 'frontend', delayStepMs: 0 },
      initialPage: { items: [], next: null },
      loadPage: vi.fn(),
      target,
    }))
    await expect(instance.fill({ pages: 0 })).rejects.toThrow(
      'Vibe fill pages must be a positive integer.',
    )
  })
})
