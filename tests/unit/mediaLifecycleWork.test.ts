import { afterEach, describe, expect, it, vi } from 'vitest'
import { computed, effectScope, markRaw, nextTick, reactive, ref, toRaw, watch } from 'vue'

import { useMediaLifecycle } from '@/components/useMediaLifecycle'
import { createInitialRuntimeState } from '@/core/initialRuntimeState'
import { mediaLifecycleContext } from '@/core/mediaLifecycle'
import type { VibeRuntimeState } from '@/core/runtime'
import type { VibeItem } from '@/types'

function item(postId: number | string): VibeItem {
  return { height: 10, items: [], postId, src: '/synthetic.jpg', width: 10 }
}

function runtime(items: VibeItem[] = []): VibeRuntimeState {
  const state = reactive(createInitialRuntimeState({ target: document.createElement('div') }, 'masonry'))
  state.items = items
  return state
}

function events() {
  return {
    error: vi.fn(),
    fullyVisible: vi.fn(),
    ready: vi.fn(),
    reelChange: vi.fn(),
    visible: vi.fn(),
  }
}

describe('media lifecycle indexed work', () => {
  afterEach(() => vi.restoreAllMocks())

  it('reads loaded identities once across repeated lifecycle contexts', () => {
    let identityReads = 0
    const state = runtime(Array.from({ length: 10_000 }, (_, postId) => ({
      ...item(postId),
      get postId() {
        identityReads += 1
        return postId
      },
    })))

    for (let event = 0; event < 100; event += 1) {
      expect(mediaLifecycleContext(state, 9_999, 0, 'masonry', null)?.postIndex).toBe(9_999)
    }

    expect(identityReads).toBeLessThanOrEqual(10_100)
  })

  it('does not reread retained identities across fifty 250-item fill appends', () => {
    const state = runtime(Array.from({ length: 250 }, (_, postId) => item(postId)))
    const get = Reflect.get
    let identityReads = 0
    Reflect.get = function (target, key, receiver) {
      if (key === 'postId') identityReads += 1
      return arguments.length === 2 ? get(target, key) : get(target, key, receiver)
    }
    try {
      for (let page = 0; page <= 50; page += 1) {
        if (page > 0) state.items = [...state.items, ...Array.from({ length: 250 }, (_, index) => item(page * 250 + index))]
        const last = (page + 1) * 250 - 1
        expect(mediaLifecycleContext(state, last, 0, 'masonry', null)?.postIndex).toBe(last)
      }
      // One first read per loaded ID plus selected event context reads. The
      // baseline rebuilt the full map: 331,551 reactive postId reads.
      expect(identityReads).toBeLessThanOrEqual(13_000)
    } finally { Reflect.get = get }
  })

  it('updates retained chunk IDs reactively and keeps the first duplicate across chunk boundaries', () => {
    const state = runtime(Array.from({ length: 500 }, (_, postId) => item(postId)))
    state.items[350]!.postId = 1
    const selected = computed(() => mediaLifecycleContext(state, 1, 0, 'masonry', null))
    expect(selected.value?.postIndex).toBe(1)
    state.items[1]!.postId = 700
    expect(selected.value?.postIndex).toBe(350)
    state.items = [...state.items, item(1)]
    expect(selected.value?.postIndex).toBe(350)
    state.items[350]!.postId = 701
    expect(selected.value?.postIndex).toBe(500)
    state.items.splice(0, 2)
    expect(selected.value?.postIndex).toBe(498)
    state.items = [item(1), ...state.items]
    expect(selected.value?.postIndex).toBe(0)
  })

  it('refreshes untracked raw and accessor identities on append without changing getter receivers', () => {
    let accessorId = 600
    const raw = markRaw(item(1))
    const accessor = { ...item(2), get postId() { return accessorId + Number(this.width) } }
    const state = runtime([raw, accessor, ...Array.from({ length: 248 }, (_, index) => item(index + 10))])
    expect(mediaLifecycleContext(state, 1, 0, 'masonry', null)?.postIndex).toBe(0)
    expect(mediaLifecycleContext(state, 610, 0, 'masonry', null)?.postIndex).toBe(1)
    raw.postId = 700
    accessorId = 800
    state.items = [...state.items, item(1000)]
    expect(mediaLifecycleContext(state, 1, 0, 'masonry', null)).toBeNull()
    expect(mediaLifecycleContext(state, 700, 0, 'masonry', null)?.item).toBe(raw)
    expect(mediaLifecycleContext(state, 610, 0, 'masonry', null)).toBeNull()
    expect(mediaLifecycleContext(state, 810, 0, 'masonry', null)?.postIndex).toBe(1)
    state.items[1]!.width = 20
    expect(mediaLifecycleContext(state, 820, 0, 'masonry', null)?.postIndex).toBe(1)
  })

  it('keeps ref-valued IDs live across append and subsequent ref mutation', () => {
    const postId = ref(500)
    const state = runtime([{ ...item(1), postId } as unknown as VibeItem, ...Array.from({ length: 249 }, (_, index) => item(index))])
    const selected = computed(() => mediaLifecycleContext(state, 500, 0, 'masonry', null))
    expect(selected.value?.postIndex).toBe(0)
    state.items = [...state.items, item(1000)]
    expect(selected.value?.postIndex).toBe(0)
    postId.value = 600
    expect(selected.value).toBeNull()
    expect(mediaLifecycleContext(state, 600, 0, 'masonry', null)?.postIndex).toBe(0)
  })

  it('refreshes custom item wrappers on append and preserves custom array index access', () => {
    let postId = 900
    const wrapped = new Proxy(reactive(item(1)), {
      get(target, key, receiver) { return key === 'postId' ? postId : Reflect.get(target, key, receiver) },
    })
    const state = runtime([wrapped, ...Array.from({ length: 249 }, (_, index) => item(index))])
    expect(mediaLifecycleContext(state, 900, 0, 'masonry', null)?.postIndex).toBe(0)
    postId = 901
    state.items = [...state.items, item(1000)]
    expect(mediaLifecycleContext(state, 900, 0, 'masonry', null)).toBeNull()
    expect(mediaLifecycleContext(state, 901, 0, 'masonry', null)?.postIndex).toBe(0)

    const alternate = reactive(item(2000))
    const array = new Proxy(reactive([item(1), item(2)]), {
      get(target, key, receiver) {
        if (key === '0') return alternate
        if (key === 'forEach') return (visit: (entry: VibeItem, index: number) => void) => {
          visit(alternate, 0)
          visit(target[1]!, 1)
        }
        return Reflect.get(target, key, receiver)
      },
    })
    const custom = runtime()
    Object.defineProperty(toRaw(custom), 'items', { get: () => array })
    expect(mediaLifecycleContext(custom, 2000, 0, 'masonry', null)?.item).toBe(alternate)
    expect(mediaLifecycleContext(custom, 1, 0, 'masonry', null)).toBeNull()
    alternate.postId = 2001
    expect(mediaLifecycleContext(custom, 2001, 0, 'masonry', null)?.postIndex).toBe(0)
  })

  it('uses forEach placement when a canonical reactive array owns a reversed iterator', () => {
    const items = [item(1), item(2)]
    Object.defineProperty(items, Symbol.iterator, { configurable: true, writable: true, value: function* (this: VibeItem[]) {
      yield this[1]!
      yield this[0]!
    } })
    const state = runtime(items)
    expect(reactive(toRaw(state.items))).toBe(state.items)
    expect(mediaLifecycleContext(state, 1, 0, 'masonry', null)).toMatchObject({ postId: 1, postIndex: 0 })
    expect(mediaLifecycleContext(state, 2, 0, 'masonry', null)).toMatchObject({ postId: 2, postIndex: 1 })
  })

  it('preserves an own forEach override on an otherwise ordinary reactive array', () => {
    const items = [item(1), item(2)]
    Object.defineProperty(items, 'forEach', { configurable: true, writable: true, value: function (this: VibeItem[], visit: (entry: VibeItem, index: number) => void) {
      visit(this[1]!, 1)
    } })
    const state = runtime(items)
    expect(mediaLifecycleContext(state, 1, 0, 'masonry', null)).toBeNull()
    expect(mediaLifecycleContext(state, 2, 0, 'masonry', null)).toMatchObject({ postId: 2, postIndex: 1 })
  })

  it('rechecks installed, replaced and deleted forEach methods after a warm lookup without appending', () => {
    const state = runtime([item(1), item(2)])
    expect(mediaLifecycleContext(state, 1, 0, 'masonry', null)?.postIndex).toBe(0)
    state.items.forEach = function (visit, thisArg) { visit.call(thisArg, this[1]!, 1, this) }
    // A reactive identity edit made the legacy full computed re-read forEach.
    state.items[0]!.postId = 7
    expect(mediaLifecycleContext(state, 7, 0, 'masonry', null)).toBeNull()
    expect(mediaLifecycleContext(state, 2, 0, 'masonry', null)?.postIndex).toBe(1)
    state.items.forEach = function (visit, thisArg) { visit.call(thisArg, this[0]!, 0, this) }
    expect(mediaLifecycleContext(state, 7, 0, 'masonry', null)?.postIndex).toBe(0)
    expect(mediaLifecycleContext(state, 2, 0, 'masonry', null)).toBeNull()
    Reflect.deleteProperty(state.items, 'forEach')
    expect(mediaLifecycleContext(state, 7, 0, 'masonry', null)?.postIndex).toBe(0)
    expect(mediaLifecycleContext(state, 2, 0, 'masonry', null)?.postIndex).toBe(1)
  })

  it('ignores a newly installed iterator for placement and detects it when the warm array later appends', () => {
    const state = runtime([item(1), item(2)])
    expect(mediaLifecycleContext(state, 1, 0, 'masonry', null)?.postIndex).toBe(0)
    state.items[Symbol.iterator] = function* () { yield this[1]!; yield this[0]! }
    expect(mediaLifecycleContext(state, 1, 0, 'masonry', null)?.postIndex).toBe(0)
    state.items.push(item(3))
    expect(mediaLifecycleContext(state, 1, 0, 'masonry', null)?.postIndex).toBe(0)
    expect(mediaLifecycleContext(state, 3, 0, 'masonry', null)?.postIndex).toBe(2)
    Reflect.deleteProperty(state.items, Symbol.iterator)
    expect(mediaLifecycleContext(state, 2, 0, 'masonry', null)?.postIndex).toBe(1)
  })

  it('preserves subclass iteration semantics instead of indexing its ordinary snapshot', () => {
    class Items extends Array<VibeItem> {
      override forEach(visit: (entry: VibeItem, index: number, array: VibeItem[]) => void, thisArg?: unknown): void {
        super.forEach((entry, index, array) => { if (index > 0) visit.call(thisArg, entry, index, array) })
      }
    }
    const state = runtime(new Items(item(1), item(2)))
    expect(mediaLifecycleContext(state, 1, 0, 'masonry', null)).toBeNull()
    expect(mediaLifecycleContext(state, 2, 0, 'masonry', null)).toMatchObject({ postId: 2, postIndex: 1 })
  })

  it('skips sparse array holes and keeps live positions when holes are filled or deleted', () => {
    const items: VibeItem[] = new Array(3)
    items[1] = item(2)
    const state = runtime(items)
    expect(mediaLifecycleContext(state, 2, 0, 'masonry', null)).toMatchObject({ postId: 2, postIndex: 1 })
    expect(mediaLifecycleContext(state, 1, 0, 'masonry', null)).toBeNull()
    state.items[0] = item(1)
    state.items[2] = item(3)
    expect(mediaLifecycleContext(state, 1, 0, 'masonry', null)?.postIndex).toBe(0)
    delete state.items[0]
    expect(mediaLifecycleContext(state, 1, 0, 'masonry', null)).toBeNull()
    expect(mediaLifecycleContext(state, 3, 0, 'masonry', null)?.postIndex).toBe(2)
  })

  it('returns the current item and position after replacement, reorder, removal and restore', () => {
    const state = runtime([item(1), item(2), item(3)])
    const context = (postId: number | string) => mediaLifecycleContext(state, postId, 0, 'masonry', null)
    expect(context(2)?.postIndex).toBe(1)

    state.items[1] = { ...item(2), src: '/updated.jpg' }
    expect(context(2)?.item.src).toBe('/updated.jpg')
    state.items.reverse()
    expect(context(3)?.postIndex).toBe(0)
    state.items.splice(1, 1)
    expect(context(2)).toBeNull()
    expect(context(1)?.postIndex).toBe(1)
    state.items.splice(1, 0, item(2))
    expect(context(2)?.postIndex).toBe(1)
    expect(context(1)?.postIndex).toBe(2)
    state.items = [item(2), item(4)]
    expect(context(2)?.postIndex).toBe(0)
    expect(context(1)).toBeNull()
    state.items[0]!.postId = 'renamed'
    expect(context(2)).toBeNull()
    expect(context('renamed')?.postIndex).toBe(0)
  })

  it('keeps number/string identities distinct and the first duplicate placement', () => {
    const state = runtime([item(1), item('1'), item(1), item(Number.NaN)])
    expect(mediaLifecycleContext(state, 1, 0, 'masonry', null)?.postIndex).toBe(0)
    expect(mediaLifecycleContext(state, '1', 0, 'masonry', null)?.postIndex).toBe(1)
    expect(mediaLifecycleContext(state, Number.NaN, 0, 'masonry', null)).toBeNull()
  })

  it('does not cache caller-owned plain mutable state', () => {
    const state = createInitialRuntimeState({ target: document.createElement('div') }, 'masonry')
    state.items = [item(1), item(2)]
    expect(mediaLifecycleContext(state, 2, 0, 'masonry', null)?.postIndex).toBe(1)
    state.items.reverse()
    expect(mediaLifecycleContext(state, 2, 0, 'masonry', null)?.postIndex).toBe(0)
    state.items = [item(1)]
    expect(mediaLifecycleContext(state, 2, 0, 'masonry', null)).toBeNull()
  })

  it('does not copy historical status entries for the next status event', () => {
    const scope = effectScope()
    const lifecycle = scope.run(() => useMediaLifecycle(runtime(), events()))!
    for (let postId = 0; postId < 1_000; postId += 1) lifecycle.markPreviewError(postId, 0)
    const iterate = Map.prototype[Symbol.iterator]
    let historicalEntries = 0
    vi.spyOn(Map.prototype, Symbol.iterator).mockImplementation(function* () {
      for (const entry of iterate.call(this)) {
        if (typeof entry[0] === 'string' && /^\d+:0$/.test(entry[0])) historicalEntries += 1
        yield entry
      }
    })

    lifecycle.markPreviewError(1_000, 0)

    expect(lifecycle.previewStates.value.size).toBe(1_001)
    expect(historicalEntries).toBe(0)
    scope.stop()
  })

  it('notifies keyed and iteration consumers for status changes and reset', async () => {
    const scope = effectScope()
    const state = runtime([item(1)])
    state.layout = 'reel'
    state.activeReelPostId = 1
    const callbacks = events()
    const lifecycle = scope.run(() => useMediaLifecycle(state, callbacks))!
    const keyed = vi.fn()
    const entries = vi.fn()
    scope.run(() => {
      watch(() => lifecycle.previewStates.value.get('1:0'), keyed)
      watch(() => [...lifecycle.previewStates.value], entries)
    })
    const oldVisit = lifecycle.previewStates.value

    lifecycle.markPreviewReady(1, 0)
    await nextTick()
    expect(keyed.mock.calls[0]?.[0]).toBe('ready')
    expect(entries.mock.calls[0]?.[0]).toEqual([['1:0', 'ready']])
    lifecycle.markPreviewError(1, 0)
    await nextTick()
    expect(keyed.mock.calls[1]?.[0]).toBe('error')
    expect(entries.mock.calls[1]?.[0]).toEqual([['1:0', 'error']])
    lifecycle.markReelReady(1, 0)
    await nextTick()
    expect(callbacks.fullyVisible).toHaveBeenCalledOnce()
    expect(lifecycle.originalStates.value.get('1:0')).toBe('ready')

    lifecycle.resetMediaLifecycle()
    await nextTick()
    expect(lifecycle.previewStates.value).not.toBe(oldVisit)
    expect(keyed.mock.calls[2]?.[0]).toBeUndefined()
    expect(entries.mock.calls[2]?.[0]).toEqual([])
    expect(lifecycle.originalStates.value.size).toBe(0)
    lifecycle.markReelReady(1, 0)
    await nextTick()
    expect(callbacks.fullyVisible).toHaveBeenCalledTimes(2)
    scope.stop()
  })

  it('keeps preview, original and mobile states independent across source changes', async () => {
    const scope = effectScope()
    const state = runtime([item(1)])
    state.layout = 'reel'
    state.activeReelPostId = 1
    const lifecycle = scope.run(() => useMediaLifecycle(state, events()))!
    lifecycle.markReelReady(1, 0)
    expect(lifecycle.originalStates.value.get('1:0')).toBe('ready')
    state.reelMediaSource = 'mobile'
    expect(lifecycle.reelStates.value.get('1:0')).toBeUndefined()
    lifecycle.markReelError(1, 0)
    expect(lifecycle.reelStates.value.get('1:0')).toBe('error')
    state.reelMediaSource = 'preview'
    expect(lifecycle.reelStates.value.get('1:0')).toBeUndefined()
    lifecycle.markReelReady(1, 0)
    expect(lifecycle.previewStates.value.get('1:0')).toBe('ready')
    lifecycle.resetMediaLifecycle()
    expect(lifecycle.previewStates.value.size).toBe(0)
    state.reelMediaSource = 'original'
    expect(lifecycle.reelStates.value.size).toBe(0)
    state.reelMediaSource = 'mobile'
    expect(lifecycle.reelStates.value.size).toBe(0)
    await nextTick()
    scope.stop()
  })
})
