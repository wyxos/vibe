import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import MasonryLoader from '@/components/MasonryLoader.vue'
import type { MasonryItemBase } from '@/masonry/types'

type IOInstance = {
  trigger: (ratio: number) => void
}

function installMockIntersectionObserver() {
  const instances: Array<MockIntersectionObserver & IOInstance> = []

  class MockIntersectionObserver {
    cb: IntersectionObserverCallback
    el: Element | null = null

    constructor(cb: IntersectionObserverCallback) {
      this.cb = cb
      instances.push(this as MockIntersectionObserver & IOInstance)
    }

    observe(el: Element) {
      this.el = el
    }

    unobserve() {}

    disconnect() {}

    takeRecords() {
      return []
    }

    trigger(ratio: number) {
      if (!this.el) throw new Error('No element observed')
      this.cb(
        [
          {
            target: this.el,
            isIntersecting: ratio > 0,
            intersectionRatio: ratio,
          } as unknown as IntersectionObserverEntry,
        ],
        this as unknown as IntersectionObserver
      )
    }
  }

  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver as unknown as typeof IntersectionObserver)

  return { instances }
}

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

function installMockVideoElement(duration = 90) {
  const proto = HTMLMediaElement.prototype as unknown as Record<string, unknown>
  const pausedState = new WeakMap<EventTarget, boolean>()
  const currentTimes = new WeakMap<EventTarget, number>()

  const prevPlay = Object.getOwnPropertyDescriptor(proto, 'play')
  const prevPause = Object.getOwnPropertyDescriptor(proto, 'pause')
  const prevDuration = Object.getOwnPropertyDescriptor(proto, 'duration')
  const prevCurrentTime = Object.getOwnPropertyDescriptor(proto, 'currentTime')
  const prevPaused = Object.getOwnPropertyDescriptor(proto, 'paused')

  const play = vi.fn(function (this: EventTarget) {
    pausedState.set(this, false)
    return Promise.resolve()
  })
  const pause = vi.fn(function (this: EventTarget) {
    pausedState.set(this, true)
  })

  Object.defineProperty(proto, 'play', {
    configurable: true,
    writable: true,
    value: play,
  })
  Object.defineProperty(proto, 'pause', {
    configurable: true,
    writable: true,
    value: pause,
  })
  Object.defineProperty(proto, 'duration', {
    configurable: true,
    get() {
      return duration
    },
  })
  Object.defineProperty(proto, 'currentTime', {
    configurable: true,
    get() {
      return currentTimes.get(this as EventTarget) ?? 0
    },
    set(value: number) {
      currentTimes.set(this as EventTarget, value)
    },
  })
  Object.defineProperty(proto, 'paused', {
    configurable: true,
    get() {
      return pausedState.get(this as EventTarget) ?? true
    },
  })

  return {
    play,
    pause,
    restore() {
      if (prevPlay) Object.defineProperty(proto, 'play', prevPlay)
      else delete proto.play

      if (prevPause) Object.defineProperty(proto, 'pause', prevPause)
      else delete proto.pause

      if (prevDuration) Object.defineProperty(proto, 'duration', prevDuration)
      else delete proto.duration

      if (prevCurrentTime) Object.defineProperty(proto, 'currentTime', prevCurrentTime)
      else delete proto.currentTime

      if (prevPaused) Object.defineProperty(proto, 'paused', prevPaused)
      else delete proto.paused
    },
  }
}

function makeVideoItem(id: string, preview = 'https://example.com/video.mp4'): MasonryItemBase {
  return {
    id,
    type: 'video',
    width: 320,
    height: 240,
    preview,
    original: 'https://example.com/original.mp4',
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('MasonryLoader', () => {
  it('starts rendering media only after >= 50% intersection', async () => {
    const { instances } = installMockIntersectionObserver()

    const item: MasonryItemBase = {
      id: 'img-1',
      type: 'image',
      width: 320,
      height: 240,
      preview: 'https://example.com/preview.jpg',
      original: 'https://example.com/original.jpg',
    }

    const wrapper = mount(MasonryLoader, { props: { item } })

    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('[data-testid="masonry-loader-spinner"]').exists()).toBe(false)

    // Below the threshold: should not render.
    const io = instances[0]
    expect(io).toBeTruthy()
    io.trigger(0.49)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('[data-testid="masonry-loader-spinner"]').exists()).toBe(false)

    // At threshold: should render.
    io.trigger(0.5)
    await wrapper.vm.$nextTick()

    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe(item.preview)

    // Media starts hidden until it succeeds.
    expect(img.classes()).not.toContain('vibe-loader__media--loaded')

    // Shows spinner until the media fires success.
    expect(wrapper.find('[data-testid="masonry-loader-spinner"]').exists()).toBe(true)

    // Emit success on load.
    await img.trigger('load')
    expect(wrapper.emitted('success')).toBeTruthy()
    expect(wrapper.find('[data-testid="masonry-loader-spinner"]').exists()).toBe(false)

    // Media fades in on success.
    expect(wrapper.find('img').classes()).toContain('vibe-loader__media--loaded')

    wrapper.unmount()
  })

  it('emits success when an image is already complete (cache hit) without relying on load event', async () => {
    const { instances } = installMockIntersectionObserver()

    const item: MasonryItemBase = {
      id: 'img-cached',
      type: 'image',
      width: 320,
      height: 240,
      preview: 'https://example.com/cached.jpg',
      original: 'https://example.com/original.jpg',
    }

    const proto = HTMLImageElement.prototype as unknown as Record<string, unknown>
    const prevComplete = Object.getOwnPropertyDescriptor(proto, 'complete')
    const prevNaturalWidth = Object.getOwnPropertyDescriptor(proto, 'naturalWidth')

    Object.defineProperty(proto, 'complete', {
      configurable: true,
      get() {
        return true
      },
    })
    Object.defineProperty(proto, 'naturalWidth', {
      configurable: true,
      get() {
        return 123
      },
    })

    const restore = () => {
      if (prevComplete) Object.defineProperty(proto, 'complete', prevComplete)
      else delete proto.complete

      if (prevNaturalWidth) Object.defineProperty(proto, 'naturalWidth', prevNaturalWidth)
      else delete proto.naturalWidth
    }

    let wrapper: ReturnType<typeof mount> | null = null
    try {
      wrapper = mount(MasonryLoader, { props: { item } })

      const io = instances[0]
      io.trigger(0.5)
      await wrapper.vm.$nextTick()

      // Success should be emitted even if we never dispatch a load event.
      await new Promise((r) => setTimeout(r, 0))
      expect(wrapper.emitted('success')).toBeTruthy()
    } finally {
      wrapper?.unmount()
      restore()
    }
  })

  it('shows error state when media fails', async () => {
    const { instances } = installMockIntersectionObserver()

    const item: MasonryItemBase = {
      id: 'img-error',
      type: 'image',
      width: 320,
      height: 240,
      preview: 'https://example.com/broken.jpg',
      original: 'https://example.com/original.jpg',
    }

    const wrapper = mount(MasonryLoader, { props: { item } })

    const io = instances[0]
    io.trigger(1)
    await wrapper.vm.$nextTick()

    await wrapper.find('img').trigger('error')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-testid="masonry-loader-error"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Error: Failed to load image.')
    expect(wrapper.text()).not.toContain('[object Event]')

    wrapper.unmount()
  })

  it('prefers preview for video src without extension', async () => {
    const { instances } = installMockIntersectionObserver()

    const item: MasonryItemBase = {
      id: 'vid-preview',
      type: 'video',
      width: 320,
      height: 240,
      preview: 'https://atlas.test/api/files/123/preview',
      original: 'https://atlas.test/api/files/123/downloaded',
    }

    const wrapper = mount(MasonryLoader, { props: { item } })

    const io = instances[0]
    io.trigger(1)
    await wrapper.vm.$nextTick()

    const video = wrapper.find('video')
    expect(video.exists()).toBe(true)
    expect(video.attributes('poster')).toBeUndefined()

    const source = wrapper.find('video source')
    expect(source.exists()).toBe(true)
    expect(source.attributes('src')).toBe(item.preview)

    wrapper.unmount()
  })

  it('shows error state when a video source fails', async () => {
    const { instances } = installMockIntersectionObserver()

    const item = makeVideoItem('vid-error', 'https://example.com/broken.mp4')

    const wrapper = mount(MasonryLoader, { props: { item } })

    const io = instances[0]
    io.trigger(1)
    await wrapper.vm.$nextTick()

    await wrapper.find('video source').trigger('error')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-testid="masonry-loader-error"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Error: Failed to load video.')
    expect(wrapper.text()).not.toContain('[object Event]')
    expect(wrapper.emitted('error')).toBeTruthy()

    wrapper.unmount()
  })

  it('plays only when hovered and in view, and pauses on unhover or exit', async () => {
    const { instances } = installMockIntersectionObserver()
    const videoMock = installMockVideoElement()

    const wrapper = mount(MasonryLoader, {
      props: {
        item: makeVideoItem('vid-hover'),
        hovered: false,
      },
    })

    try {
      const lazyIo = instances[0]
      const playbackIo = instances[1]

      lazyIo.trigger(1)
      await wrapper.vm.$nextTick()

      expect(wrapper.find('video').exists()).toBe(true)
      expect(videoMock.play).not.toHaveBeenCalled()

      await wrapper.setProps({ hovered: true })
      await wrapper.vm.$nextTick()

      await wrapper.find('video').trigger('loadedmetadata')
      await wrapper.vm.$nextTick()

      expect(videoMock.play).not.toHaveBeenCalled()

      playbackIo.trigger(1)
      await wrapper.vm.$nextTick()
      await Promise.resolve()

      expect(videoMock.play).toHaveBeenCalledTimes(1)

      await wrapper.setProps({ hovered: false })
      await wrapper.vm.$nextTick()

      expect(videoMock.pause).toHaveBeenCalledTimes(1)

      await wrapper.setProps({ hovered: true })
      await wrapper.vm.$nextTick()
      await Promise.resolve()

      expect(videoMock.play).toHaveBeenCalledTimes(2)

      playbackIo.trigger(0)
      await wrapper.vm.$nextTick()

      expect(videoMock.pause).toHaveBeenCalledTimes(2)
    } finally {
      wrapper.unmount()
      videoMock.restore()
    }
  })

  it('seeks the video via the built-in controls and keeps slider state in sync', async () => {
    installPointerEvent()
    const { instances } = installMockIntersectionObserver()
    const videoMock = installMockVideoElement(90)

    const wrapper = mount(MasonryLoader, {
      props: {
        item: makeVideoItem('vid-seek'),
        hovered: false,
      },
    })

    try {
      const lazyIo = instances[0]
      lazyIo.trigger(1)
      await wrapper.vm.$nextTick()

      await wrapper.find('video').trigger('loadedmetadata')
      await wrapper.vm.$nextTick()

      const track = wrapper.get('.vibe-video-controls__track')
      const trackEl = track.element as HTMLElement & {
        setPointerCapture?: (pointerId: number) => void
      }

      Object.defineProperty(trackEl, 'getBoundingClientRect', {
        configurable: true,
        value: () => ({
          left: 0,
          top: 0,
          right: 100,
          bottom: 12,
          width: 100,
          height: 12,
          x: 0,
          y: 0,
          toJSON() {
            return {}
          },
        }),
      })
      trackEl.setPointerCapture = vi.fn()

      trackEl.dispatchEvent(new MockPointerEvent('pointerdown', { bubbles: true, clientX: 50, pointerId: 9 }))
      await wrapper.vm.$nextTick()

      const video = wrapper.get('video').element as HTMLVideoElement
      const slider = wrapper.get('[role="slider"]')

      expect(video.currentTime).toBe(45)
      expect(slider.attributes('aria-valuenow')).toBe('45')
    } finally {
      wrapper.unmount()
      videoMock.restore()
    }
  })
})
