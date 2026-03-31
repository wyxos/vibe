import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import MasonryVideoControls from '@/components/MasonryVideoControls.vue'

class MockPointerEvent extends MouseEvent {
  pointerId: number

  constructor(type: string, init: MouseEventInit & { pointerId?: number } = {}) {
    super(type, init)
    this.pointerId = init.pointerId ?? 1
  }
}

function installPointerEvent() {
  vi.stubGlobal('PointerEvent', MockPointerEvent as unknown as typeof PointerEvent)
}

function prepareTrack(wrapper: ReturnType<typeof mount>) {
  const track = wrapper.get('.vibe-video-controls__track')
  const trackEl = track.element as HTMLElement & {
    setPointerCapture?: (pointerId: number) => void
    releasePointerCapture?: (pointerId: number) => void
  }

  Object.defineProperty(trackEl, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({
      left: 10,
      top: 0,
      right: 210,
      bottom: 12,
      width: 200,
      height: 12,
      x: 10,
      y: 0,
      toJSON() {
        return {}
      },
    }),
  })

  trackEl.setPointerCapture = vi.fn()
  trackEl.releasePointerCapture = vi.fn()

  return { track, trackEl }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('MasonryVideoControls', () => {
  it('emits clamped, quantized seek values during pointer drag', async () => {
    installPointerEvent()

    const wrapper = mount(MasonryVideoControls, {
      props: {
        duration: 100,
        currentTime: 10,
        step: 10,
      },
    })

    const { trackEl } = prepareTrack(wrapper)

    trackEl.dispatchEvent(new MockPointerEvent('pointerdown', { bubbles: true, clientX: 66, pointerId: 7 }))
    await wrapper.vm.$nextTick()

    trackEl.dispatchEvent(new MockPointerEvent('pointermove', { bubbles: true, clientX: 181, pointerId: 7 }))
    await wrapper.vm.$nextTick()

    trackEl.dispatchEvent(new MockPointerEvent('pointerup', { bubbles: true, clientX: 181, pointerId: 7 }))
    await wrapper.vm.$nextTick()

    trackEl.dispatchEvent(new MockPointerEvent('pointermove', { bubbles: true, clientX: 120, pointerId: 7 }))
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('seek')).toEqual([[30], [90]])
    expect(trackEl.setPointerCapture).toHaveBeenCalledWith(7)
    expect(trackEl.releasePointerCapture).toHaveBeenCalledWith(7)

    wrapper.unmount()
  })

  it('stops dragging on pointerleave and pointercancel', async () => {
    installPointerEvent()

    const wrapper = mount(MasonryVideoControls, {
      props: {
        duration: 100,
        currentTime: 10,
        step: 10,
      },
    })

    const { trackEl } = prepareTrack(wrapper)

    trackEl.dispatchEvent(new MockPointerEvent('pointerdown', { bubbles: true, clientX: 40, pointerId: 3 }))
    await wrapper.vm.$nextTick()

    trackEl.dispatchEvent(new MockPointerEvent('pointerleave', { bubbles: true, clientX: 40, pointerId: 3 }))
    await wrapper.vm.$nextTick()

    trackEl.dispatchEvent(new MockPointerEvent('pointermove', { bubbles: true, clientX: 170, pointerId: 3 }))
    await wrapper.vm.$nextTick()

    trackEl.dispatchEvent(new MockPointerEvent('pointerdown', { bubbles: true, clientX: 110, pointerId: 4 }))
    await wrapper.vm.$nextTick()

    trackEl.dispatchEvent(new MockPointerEvent('pointercancel', { bubbles: true, clientX: 110, pointerId: 4 }))
    await wrapper.vm.$nextTick()

    trackEl.dispatchEvent(new MockPointerEvent('pointermove', { bubbles: true, clientX: 200, pointerId: 4 }))
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('seek')).toEqual([[20], [50]])

    wrapper.unmount()
  })

  it('supports keyboard seeking with arrows, Home, and End', async () => {
    const wrapper = mount(MasonryVideoControls, {
      props: {
        duration: 100,
        currentTime: 10,
        keyboardStep: 5,
      },
    })

    const slider = wrapper.get('[role="slider"]')

    await slider.trigger('keydown', { key: 'ArrowRight' })
    await slider.trigger('keydown', { key: 'ArrowLeft' })
    await slider.trigger('keydown', { key: 'Home' })
    await slider.trigger('keydown', { key: 'End' })

    expect(wrapper.emitted('seek')).toEqual([[15], [5], [0], [100]])

    wrapper.unmount()
  })
})
