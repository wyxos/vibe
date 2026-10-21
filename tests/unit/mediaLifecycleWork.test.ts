import { afterEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, reactive, watch } from 'vue'

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
