import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createVibe, type CreateVibeOptions, type VibeInstance, type VibeItem, type VibePage } from '@/index'

function item(postId: number | string, width = 300): VibeItem {
  return { postId, src: `https://example.com/${postId}.jpg`, width, height: 400, items: [] }
}

describe('completed page replacement', () => {
  let target: HTMLDivElement
  let instance: VibeInstance | null = null

  beforeEach(() => {
    target = document.createElement('div')
    document.body.append(target)
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(800)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(600)
  })
  afterEach(() => {
    instance?.destroy()
    instance = null
    target.remove()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  async function mount(loadPage?: (request: { cursor: unknown, signal: AbortSignal }) => Promise<VibePage>) {
    instance = createVibe({
      target, infiniteScroll: false, loadPage: loadPage ?? vi.fn().mockResolvedValue({ items: [], next: null }),
      initialPage: { items: [item(1), item(2)], current: 'old-1', next: 'old-2', total: 4 },
      removalReconciliation: loadPage ? { pageSize: 2 } : undefined,
    })
    await instance.mount()
    await flushPromises()
    return instance
  }

  it('keeps the current feed until native exits finish and preserves matching DOM keys', async () => {
    const vibe = await mount()
    const common = target.querySelector('[data-post-id="2"]')
    const outgoing = target.querySelector('[data-post-id="1"]')
    let finish!: () => void
    const finished = new Promise<void>((resolve) => { finish = resolve })
    Object.defineProperty(outgoing, 'getAnimations', { value: () => [{ finished }] })
    vibe.setLoadMoreLocked(true)
    const replacing = vibe.replacePage({
      items: [item('2', 600), item(3), item(3)], current: 'search-1', next: 'search-2', total: 7,
    })
    await flushPromises()
    expect(vibe.getState().items.map(({ postId }) => postId)).toEqual([1, 2])
    expect(outgoing?.classList.contains('media-card--leaving')).toBe(true)
    expect(target.querySelector('[data-post-id="2"]')).toBe(common)
    finish()
    await replacing
    await flushPromises()
    expect(vibe.getState().items.map(({ postId }) => postId)).toEqual([2, 3])
    expect(vibe.getState()).toMatchObject({ current: 'search-1', next: 'search-2', total: 7, loadMoreLocked: true })
    expect(vibe.getState().items[0]?.width).toBe(600)
    expect(target.querySelector('[data-post-id="2"]')).toBe(common)
  })

  it('aborts a stale next page and resets cursor, tombstones and removal tokens', async () => {
    let staleResolve!: (page: VibePage) => void
    let newResolve!: (page: VibePage) => void
    const loadPage = vi.fn()
      .mockImplementationOnce(() => new Promise<VibePage>((resolve) => { staleResolve = resolve }))
      .mockImplementationOnce(() => new Promise<VibePage>((resolve) => { newResolve = resolve }))
    const vibe = await mount(loadPage)
    const removal = await vibe.removeItems([1], { staggerMs: 0 })
    const oldRequest = vibe.loadNext()
    await flushPromises()
    const signal = loadPage.mock.calls[0]?.[0].signal as AbortSignal
    await vibe.replacePage({ items: [item(1), item(4)], current: 'new-1', next: 'new-2', total: 3 })
    expect(signal.aborted).toBe(true)
    expect(vibe.restoreRemoval(removal)).toBe(false)
    expect(vibe.undoLastRemoval()).toBeNull()
    const newRequest = vibe.loadNext()
    await flushPromises()
    staleResolve({ items: [item(99)], next: null })
    await oldRequest
    expect(vibe.getState().items.map(({ postId }) => postId)).toEqual([1, 4])
    expect(vibe.getState().isLoadingMore).toBe(true)
    newResolve({ items: [item(5)], current: 'new-2', next: null })
    await newRequest
    expect(loadPage.mock.calls[1]?.[0].cursor).toBe('new-2')
    expect(vibe.getState().items.map(({ postId }) => postId)).toEqual([1, 4, 5])
  })

  it('cancels unfinished native exits when newer results arrive', async () => {
    const vibe = await mount()
    const outgoing = target.querySelector('[data-post-id="1"]')
    Object.defineProperty(outgoing, 'getAnimations', { value: () => [{ finished: new Promise(() => {}) }] })
    const oldReplacement = vibe.replacePage({ items: [item(2), item(3)], next: null })
    await flushPromises()
    const latest = vibe.replacePage({ items: [item(1), item(2)], current: 'latest', next: null, total: 2 })
    await Promise.all([oldReplacement, latest])
    await flushPromises()
    expect(vibe.getState().items.map(({ postId }) => postId)).toEqual([1, 2])
    expect(vibe.getState().current).toBe('latest')
    expect(target.querySelector('.media-card--leaving')).toBeNull()
  })

  it('skips exit waiting for reduced motion and resets scroll only when requested', async () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })))
    const vibe = await mount()
    const scroller = target.querySelector<HTMLElement>('.gallery-shell')!
    scroller.scrollTop = 200
    const outgoing = target.querySelector('[data-post-id="1"]')
    const getAnimations = vi.fn(() => [{ finished: new Promise(() => {}) }])
    Object.defineProperty(outgoing, 'getAnimations', { value: getAnimations })
    await vibe.replacePage({ items: [item(2)], next: null })
    expect(scroller.scrollTop).toBe(200)
    expect(getAnimations).not.toHaveBeenCalled()
    await vibe.replacePage({ items: [item(2), item(3)], next: null }, { resetScroll: true })
    expect(scroller.scrollTop).toBe(0)
    expect(target.querySelector('.media-card--leaving')).toBeNull()
  })

  it('validates before interrupting the current feed and supports an empty result', async () => {
    const vibe = await mount()
    await expect(vibe.replacePage({ items: [], next: true } as unknown as VibePage)).rejects.toThrow()
    expect(vibe.getState().items.map(({ postId }) => postId)).toEqual([1, 2])
    await vibe.replacePage({ items: [], current: 'empty', next: null, total: 0 })
    expect(vibe.getState()).toMatchObject({ items: [], current: 'empty', next: null, total: 0 })
  })

  it('resolves a pending replacement on teardown without committing its new page', async () => {
    const vibe = await mount()
    const outgoing = target.querySelector('[data-post-id="1"]')
    Object.defineProperty(outgoing, 'getAnimations', { value: () => [{ finished: new Promise(() => {}) }] })
    const replacing = vibe.replacePage({ items: [item(2), item(3)], next: null })
    await flushPromises()
    vibe.destroy()
    await replacing
    expect(vibe.getState().items.map(({ postId }) => postId)).toEqual([1, 2])
    expect(target.querySelector('.vibe-surface')).toBeNull()
  })

  it('lets cancelLoading interrupt an unfinished replacement', async () => {
    const vibe = await mount()
    const outgoing = target.querySelector('[data-post-id="1"]')
    Object.defineProperty(outgoing, 'getAnimations', { value: () => [{ finished: new Promise(() => {}) }] })
    const replacing = vibe.replacePage({ items: [item(2), item(3)], next: null })
    await flushPromises()
    await vibe.cancelLoading()
    await replacing
    expect(vibe.getState().items.map(({ postId }) => postId)).toEqual([1, 2])
    expect(target.querySelector('.media-card--leaving')).toBeNull()
  })

  it.each(['autofill', 'fill'] as const)('cancels a durable %s session before committing completed results', async (mode) => {
    const onCancel = vi.fn().mockResolvedValue(undefined)
    const session = { cycleId: 'cycle', feedKey: 'feed', received: 1, sequence: 1, sessionId: 'session', status: 'waiting' as const }
    const options: CreateVibeOptions = {
      target, infiniteScroll: false, loadPage: vi.fn(),
      initialPage: { items: [item(1)], current: 'old-1', next: 'old-2' },
      ...(mode === 'autofill' ? {
        autofill: { strategy: 'backend' as const, feedKey: 'feed', pageSize: 4, onCancel, onUnderfilled: vi.fn(), initialSession: { ...session, pageSize: 4 } },
      } : {
        fill: { strategy: 'backend' as const, feedKey: 'feed', onCancel, onStart: vi.fn(), initialSession: { ...session, completedPages: 1, target: { until: 'end' as const } } },
      }),
    }
    instance = createVibe(options)
    await instance.mount()
    await instance.replacePage({ items: [item(3)], current: 'new-1', next: null })
    expect(onCancel).toHaveBeenCalledOnce()
    expect(instance.getState().items.map(({ postId }) => postId)).toEqual([3])
    expect(instance.getState()[mode].status).toBe('idle')
  })
})
