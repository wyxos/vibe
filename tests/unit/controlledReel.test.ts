import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import VibeControlledReel from '@/components/VibeControlledReel.vue'
import ReelFeed from '@/components/ReelFeed.vue'
import type { VibeControlledReelRequest, VibeControlledReelState } from '@/core/controlledReel'

function state(update: Partial<VibeControlledReelState> = {}): VibeControlledReelState {
  return { revision: 1, current: { id: 'b' }, previous: { id: 'a' }, next: { id: 'c' },
    canPrevious: true, canNext: true, position: 1, total: 3_000_000, ...update }
}

describe('controlled reel', () => {
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(600)
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
  })
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

  it('establishes that one dummy feed post cannot navigate an external queue', async () => {
    const wrapper = mount(ReelFeed, { props: {
      canRetryEnd: false, hasNext: false, infiniteScroll: false, isLoadingMore: false,
      items: [{ postId: 10, src: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=',
        width: 1, height: 1, items: [] }],
      loadMoreLocked: false, mediaIndices: new Map(), nextPageError: false,
      previewStates: new Map(), total: 3_000_000,
      reelAutoAdvance: { enabled: false, includePostItems: false, intervalMs: 5000 },
    } })
    expect(wrapper.vm.moveActivePost(1)).toBe(false)
    expect(wrapper.vm.moveActivePost(-1)).toBe(false)
    expect(wrapper.get('.gallery-shell').attributes('data-active-post-id')).toBe('10')
    wrapper.unmount()
  })

  it('mounts only the bounded window and preserves the one active media node', async () => {
    const onNavigate = vi.fn()
    const wrapper = mount(VibeControlledReel, {
      props: { state: state(), onNavigate }, slots: { default: () => h('video') },
    })
    const video = wrapper.get('video').element
    expect(wrapper.findAll('.vibe-controlled-reel-frame')).toHaveLength(3)
    expect(wrapper.findAll('video')).toHaveLength(1)
    expect(wrapper.get('.vibe-controlled-reel').element.scrollTop).toBe(600)
    await wrapper.setProps({ state: state({ revision: 2, current: { id: 'a' }, canPrevious: false }) })
    expect(wrapper.get('video').element).toBe(video)
    expect(wrapper.get('.vibe-controlled-reel').element.scrollTop).toBe(0)
    expect(onNavigate).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('sends one intent for repeated scrolls while the host remains authoritative', async () => {
    let finish!: () => void
    const onNavigate = vi.fn((_request: VibeControlledReelRequest) => new Promise<void>(resolve => { finish = resolve }))
    const wrapper = mount(VibeControlledReel, { props: { state: state(), onNavigate } })
    const viewport = wrapper.get('.vibe-controlled-reel')
    viewport.element.scrollTop = 1200
    await viewport.trigger('scroll')
    await viewport.trigger('scroll')
    expect(onNavigate).toHaveBeenCalledTimes(1)
    expect(onNavigate.mock.calls[0]?.[0].direction).toBe('next')
    expect(viewport.attributes('data-current-id')).toBe('b')
    expect(viewport.attributes('aria-busy')).toBe('true')
    finish()
    await flushPromises()
    expect(viewport.element.scrollTop).toBe(600)
    expect(viewport.attributes('aria-busy')).toBe('false')
    wrapper.unmount()
  })

  it('supports unloaded neighbors, boundaries and editable keyboard targets', async () => {
    const onNavigate = vi.fn((_request: VibeControlledReelRequest) => false)
    const wrapper = mount(VibeControlledReel, { props: {
      state: state({ previous: null, next: null, canPrevious: false }), onNavigate,
    }, slots: { default: () => h('input') } })
    const viewport = wrapper.get('.vibe-controlled-reel')
    expect(wrapper.findAll('.vibe-controlled-reel-frame')).toHaveLength(2)
    await viewport.trigger('keydown', { key: 'ArrowUp' })
    await wrapper.get('input').trigger('keydown', { key: 'ArrowDown' })
    expect(onNavigate).not.toHaveBeenCalled()
    await viewport.trigger('keydown', { key: 'ArrowDown' })
    await flushPromises()
    expect(onNavigate).toHaveBeenCalledTimes(1)
    expect(onNavigate.mock.calls[0]?.[0].direction).toBe('next')
    expect(viewport.element.scrollTop).toBe(0)
    wrapper.unmount()
  })

  it('aborts pending work on revision change and ignores late out-of-order failure', async () => {
    const requests: VibeControlledReelRequest[] = []
    let rejectOld!: (error: Error) => void
    const onNavigate = vi.fn((request: VibeControlledReelRequest) => {
      requests.push(request)
      if (requests.length === 1) return new Promise<void>((_, reject) => { rejectOld = reject })
      return false
    })
    const wrapper = mount(VibeControlledReel, { props: { state: state(), onNavigate } })
    const old = wrapper.vm.navigate('next')
    await flushPromises()
    await wrapper.setProps({ state: state({ next: { id: 'refreshed-artwork' } }) })
    expect(requests[0]?.signal.aborted).toBe(false)
    await wrapper.setProps({ state: state({ revision: 'new-source', current: { id: 'other' } }) })
    expect(requests[0]?.signal.aborted).toBe(true)
    await expect(old).resolves.toBeUndefined()
    await wrapper.vm.navigate('previous')
    expect(requests[1]?.snapshot.current?.id).toBe('other')
    rejectOld(new Error('obsolete'))
    await flushPromises()
    expect(wrapper.emitted('navigationError')).toBeUndefined()
    expect(wrapper.attributes('data-current-id')).toBe('other')
    wrapper.unmount()
  })

  it('bounces after failure, permits retry and cancels on unmount', async () => {
    let request: VibeControlledReelRequest | undefined
    const onNavigate = vi.fn((context: VibeControlledReelRequest) => {
      request = context
      if (onNavigate.mock.calls.length === 1) throw new Error('synthetic failure')
      return new Promise<void>(() => {})
    })
    const wrapper = mount(VibeControlledReel, { props: { state: state(), onNavigate } })
    await expect(wrapper.vm.navigate('next')).resolves.toBeUndefined()
    expect(wrapper.emitted('navigationError')).toHaveLength(1)
    expect(wrapper.element.scrollTop).toBe(600)
    const pending = wrapper.vm.navigate('previous')
    await flushPromises()
    wrapper.unmount()
    expect(request?.signal.aborted).toBe(true)
    await expect(pending).resolves.toBeUndefined()
  })

  it('discards the rest of a touch and its inertia after the host changes revision', async () => {
    const onNavigate = vi.fn(() => false)
    const wrapper = mount(VibeControlledReel, { props: { state: state(), onNavigate } })
    const viewport = wrapper.get('.vibe-controlled-reel')
    await viewport.trigger('touchstart')
    viewport.element.scrollTop = 750
    await viewport.trigger('scroll')
    await wrapper.setProps({ state: state({ revision: 2 }) })
    viewport.element.scrollTop = 1200
    await viewport.trigger('scroll')
    await viewport.trigger('touchend')
    viewport.element.scrollTop = 1200
    await viewport.trigger('scroll')
    expect(onNavigate).not.toHaveBeenCalled()
    expect(viewport.element.scrollTop).toBe(600)
    await viewport.trigger('touchstart')
    viewport.element.scrollTop = 1200
    await viewport.trigger('scroll')
    await viewport.trigger('touchend')
    await flushPromises()
    expect(onNavigate).toHaveBeenCalledOnce()
    wrapper.unmount()
  })
})
