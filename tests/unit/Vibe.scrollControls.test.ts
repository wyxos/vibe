import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'

import Layout from '@/components/Layout.vue'
import type { VibeViewerItem } from '@/components/viewer'
import type { VibeHandle } from '@/components/viewer-core/useViewer'
import { createSeededVibeProps } from '../helpers/createSeededVibeProps'

const DEFAULT_VIEWPORT_WIDTH = window.innerWidth
const DEFAULT_VIEWPORT_HEIGHT = window.innerHeight

describe('VibeLayout scroll controls', () => {
  afterEach(() => {
    setViewportWidth(DEFAULT_VIEWPORT_WIDTH)
    setViewportHeight(DEFAULT_VIEWPORT_HEIGHT)
    vi.restoreAllMocks()
  })

  it('exposes fill and auto-scroll methods on the public handle', async () => {
    setViewportWidth(1_280)

    const wrapper = mount(Layout, {
      props: createSeededVibeProps([createImageItem('image-handle', 'Handle image')]),
    })

    await flushDom()

    const handle = wrapper.vm as unknown as VibeHandle

    expect(typeof handle.autoScroll).toBe('function')
    expect(typeof handle.fillUntil).toBe('function')
    expect(typeof handle.fillUntilEnd).toBe('function')

    wrapper.unmount()
  })

  it('adds the configured bottom load buffer to the desktop list scroll budget', async () => {
    setViewportWidth(1_280)
    setViewportHeight(600)

    const wrapper = mount(Layout, {
      props: createSeededVibeProps([createImageItem('image-buffer', 'Buffered image')], {
        bottomLoadBufferPx: 0,
      }),
    })

    await flushDom()

    expect(wrapper.get('[data-testid="vibe-list-content"]').attributes('style')).toContain('height: 800px;')

    await wrapper.setProps({
      bottomLoadBufferPx: 125,
    })
    await flushDom()

    expect(wrapper.get('[data-testid="vibe-list-content"]').attributes('style')).toContain('height: 925px;')

    wrapper.unmount()
  })

  it('auto-scrolls the desktop list at the requested speed', async () => {
    setViewportWidth(1_280)
    setViewportHeight(600)

    const frameCallbacks: FrameRequestCallback[] = []
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback: FrameRequestCallback) => {
      frameCallbacks.push(callback)
      return frameCallbacks.length
    })
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})

    const wrapper = mount(Layout, {
      props: createSeededVibeProps(Array.from({ length: 24 }, (_, index) =>
        createImageItem(`image-auto-scroll-${index + 1}`, `Auto scroll item ${index + 1}`),
      )),
    })

    await flushDom()

    const handle = wrapper.vm as unknown as VibeHandle
    const scrollViewport = wrapper.get('[data-testid="vibe-list-scroll"]').element as HTMLElement
    setScrollMetrics(scrollViewport, 0, 600, 3_000)
    frameCallbacks.length = 0

    handle.autoScroll(120)

    expect(frameCallbacks).toHaveLength(1)

    frameCallbacks.shift()?.(1_000)
    await flushDom()

    expect(scrollViewport.scrollTop).toBe(0)

    frameCallbacks.shift()?.(1_250)
    await flushDom()

    expect(scrollViewport.scrollTop).toBe(30)

    handle.autoScroll(0)
    frameCallbacks.shift()?.(1_500)
    await flushDom()

    expect(scrollViewport.scrollTop).toBe(30)

    wrapper.unmount()
  })
})

function createImageItem(id: string, title?: string): VibeViewerItem {
  return {
    id,
    type: 'image',
    title,
    url: `https://example.com/${id}.jpg`,
    width: 1_920,
    height: 1_080,
    preview: {
      url: `https://example.com/${id}-preview.jpg`,
      width: 320,
      height: 180,
    },
  }
}

async function flushDom() {
  await nextTick()
  await Promise.resolve()
  await nextTick()
}

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: width,
    writable: true,
  })
}

function setViewportHeight(height: number) {
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: height,
    writable: true,
  })
}

function setScrollMetrics(element: HTMLElement, scrollTop: number, clientHeight: number, scrollHeight: number) {
  Object.defineProperty(element, 'scrollTop', {
    configurable: true,
    value: scrollTop,
    writable: true,
  })
  Object.defineProperty(element, 'clientHeight', {
    configurable: true,
    value: clientHeight,
  })
  Object.defineProperty(element, 'scrollHeight', {
    configurable: true,
    value: scrollHeight,
  })
}
