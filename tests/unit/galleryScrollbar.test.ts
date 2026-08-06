import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import GalleryScrollbar from '@/components/GalleryScrollbar.vue'

class ResizeObserverStub {
  disconnect = vi.fn()
  observe = vi.fn()
}

describe('GalleryScrollbar', () => {
  let scrollElement: HTMLDivElement
  let scrollHeightReads = 0
  let clientHeightReads = 0

  beforeEach(() => {
    scrollElement = document.createElement('div')
    document.body.append(scrollElement)
    vi.stubGlobal('ResizeObserver', ResizeObserverStub)
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      callback(0)
      return 1
    }))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(() => {
      scrollHeightReads += 1
      return 2_000
    })
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(function () {
      clientHeightReads += 1
      return this.classList.contains('gallery-scrollbar') ? 500 : 500
    })
  })

  afterEach(() => {
    scrollElement.remove()
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  async function mountScrollbar() {
    const wrapper = mount(GalleryScrollbar, {
      props: {
        contentSize: 2_000,
        controlsId: 'gallery',
        scrollElement,
      },
    })
    await flushPromises()
    return wrapper
  }

  it('updates only the cached thumb offset during ordinary scrolling', async () => {
    const wrapper = await mountScrollbar()
    const initialScrollHeightReads = scrollHeightReads
    const initialClientHeightReads = clientHeightReads

    scrollElement.scrollTop = 750
    scrollElement.dispatchEvent(new Event('scroll'))
    await flushPromises()

    expect(scrollHeightReads).toBe(initialScrollHeightReads)
    expect(clientHeightReads).toBe(initialClientHeightReads)
    expect(wrapper.get('.gallery-scrollbar-thumb').attributes('style'))
      .toContain('translate3d(0, 187.5px, 0)')
    wrapper.unmount()
  })

  it('keeps one idle-release timer while scroll events continue', async () => {
    vi.useFakeTimers()
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout')
    const wrapper = await mountScrollbar()
    const initialTimerCalls = setTimeoutSpy.mock.calls.length

    scrollElement.dispatchEvent(new Event('scroll'))
    await vi.advanceTimersByTimeAsync(60)
    scrollElement.dispatchEvent(new Event('scroll'))

    expect(setTimeoutSpy).toHaveBeenCalledTimes(initialTimerCalls + 1)
    expect(wrapper.get('.gallery-scrollbar').classes())
      .toContain('gallery-scrollbar--interacting')

    await vi.advanceTimersByTimeAsync(60)
    expect(setTimeoutSpy).toHaveBeenCalledTimes(initialTimerCalls + 2)
    await vi.advanceTimersByTimeAsync(60)
    expect(wrapper.get('.gallery-scrollbar').classes())
      .not.toContain('gallery-scrollbar--interacting')
    wrapper.unmount()
  })
})
