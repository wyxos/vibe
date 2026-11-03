import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { provideReelControlsVisibility, useReelControlsVisibility } from '@/components/useReelControlsVisibility'
import { VibeReelAudioController } from '@/core/reelAudioController'

describe('native reel controls visibility', () => {
  let wrapper: ReturnType<typeof mount> | undefined
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => { wrapper?.unmount(); wrapper = undefined; vi.useRealTimers() })

  function setup() {
    let activity!: ReturnType<typeof useReelControlsVisibility>
    const item = ref(1)
    const Card = defineComponent({ setup() {
      activity = useReelControlsVisibility()
      activity.ready()
      return () => h('div', { 'data-hidden': activity.hidden.value })
    } })
    wrapper = mount(defineComponent({ setup() {
      provideReelControlsVisibility()
      return () => h(Card, { key: item.value })
    } }))
    return { get activity() { return activity }, item }
  }

  it('shows initially and hides only after five seconds of inactivity', async () => {
    const state = setup()
    expect(state.activity.hidden.value).toBe(false)
    await vi.advanceTimersByTimeAsync(4999)
    expect(state.activity.hidden.value).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    expect(state.activity.hidden.value).toBe(true)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('carries the hidden state across remounted items and reveals on input', async () => {
    const state = setup()
    await vi.advanceTimersByTimeAsync(5000)
    state.item.value++
    await nextTick()
    expect(state.activity.hidden.value).toBe(true)
    expect(vi.getTimerCount()).toBe(0)
    state.activity.reveal()
    expect(state.activity.hidden.value).toBe(false)
    await vi.advanceTimersByTimeAsync(5000)
    expect(state.activity.hidden.value).toBe(true)
  })

  it('resets the one deadline when activity occurs', async () => {
    const state = setup()
    await vi.advanceTimersByTimeAsync(4000)
    state.activity.reveal()
    expect(vi.getTimerCount()).toBe(1)
    await vi.advanceTimersByTimeAsync(4000)
    expect(state.activity.hidden.value).toBe(false)
    await vi.advanceTimersByTimeAsync(1000)
    expect(state.activity.hidden.value).toBe(true)
  })

  it('keeps focused controls, open popovers and held gestures visible', async () => {
    const state = setup()
    state.activity.onFocusIn()
    state.activity.onInteractionChange(true)
    state.activity.onPointerDown()
    await vi.advanceTimersByTimeAsync(10000)
    expect(state.activity.hidden.value).toBe(false)
    state.activity.onInteractionChange(false)
    window.dispatchEvent(new Event('pointerup'))
    await vi.advanceTimersByTimeAsync(5000)
    expect(state.activity.hidden.value).toBe(false)
    state.activity.onFocusOut({ relatedTarget: null } as FocusEvent)
    await vi.advanceTimersByTimeAsync(5000)
    expect(state.activity.hidden.value).toBe(true)
  })

  it('discards old item interaction holds and cleans up all deadlines on close', async () => {
    const state = setup()
    state.activity.onInteractionChange(true)
    state.item.value++
    await nextTick()
    await vi.advanceTimersByTimeAsync(5000)
    expect(state.activity.hidden.value).toBe(true)
    state.activity.reveal()
    wrapper!.unmount()
    wrapper = undefined
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('native reel audio defaults', () => {
  it('keeps reel sound enabled even when feed previews explicitly mute', () => {
    const audio = new VibeReelAudioController({ target: '#target', mediaCard: { videoMuted: true } })
    expect(audio.get()).toEqual({ muted: false, volume: 1, lastAudibleVolume: 1 })
  })

  it('preserves an explicit reel mute preference', () => {
    const audio = new VibeReelAudioController({ target: '#target', initialReelAudioState: {
      muted: true, volume: 0.4, lastAudibleVolume: 0.4,
    } })
    expect(audio.get().muted).toBe(true)
    expect(audio.get().volume).toBe(0.4)
  })
})
