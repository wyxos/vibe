import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'

import Layout from '@/components/Layout.vue'
import type { VibeViewerItem } from '@/components/viewer'
import { createSeededVibeProps } from '../helpers/createSeededVibeProps'

const DEFAULT_VIEWPORT_WIDTH = window.innerWidth
const DEFAULT_FULLSCREEN_ELEMENT_DESCRIPTOR = Object.getOwnPropertyDescriptor(Document.prototype, 'fullscreenElement')
const DEFAULT_REQUEST_FULLSCREEN_DESCRIPTOR = Object.getOwnPropertyDescriptor(HTMLVideoElement.prototype, 'requestFullscreen')

describe('Fullscreen media volume controls', () => {
  afterEach(() => {
    setViewportWidth(DEFAULT_VIEWPORT_WIDTH)
    restoreFullscreenElement()
    restoreRequestFullscreen()
    vi.restoreAllMocks()
  })

  it('opens the phone volume popover first, then toggles mute while it is visible', async () => {
    setViewportWidth(390)
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve())
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})

    const wrapper = mount(Layout, {
      props: createSeededVibeProps([createVideoItem('video-volume-phone', 'Phone volume')]),
    })

    await flushDom()

    const video = wrapper.get('video').element as HTMLVideoElement

    expect(wrapper.get('[data-testid="vibe-media-volume"]').attributes('data-layout')).toBe('vertical')
    expect(wrapper.find('[data-testid="vibe-media-volume-popover"]').exists()).toBe(false)
    expect(video.muted).toBe(false)
    expect(video.volume).toBe(1)

    await wrapper.get('[data-testid="vibe-media-volume-button"]').trigger('click')
    await flushDom()

    expect(wrapper.get('[data-testid="vibe-media-volume-popover"]').exists()).toBe(true)
    expect(video.muted).toBe(false)
    expect(video.volume).toBe(1)

    await wrapper.get('[data-testid="vibe-media-volume-slider"]').setValue('0.35')
    await flushDom()

    expect(video.muted).toBe(false)
    expect(video.volume).toBeCloseTo(0.35, 2)

    await wrapper.get('[data-testid="vibe-media-volume-button"]').trigger('click')
    await flushDom()

    expect(video.muted).toBe(true)
    expect(video.volume).toBeCloseTo(0.35, 2)

    await wrapper.get('[data-testid="vibe-media-volume-button"]').trigger('click')
    await flushDom()

    expect(video.muted).toBe(false)
    expect(video.volume).toBeCloseTo(0.35, 2)

    await wrapper.get('[data-testid="vibe-media-volume-slider"]').setValue('0')
    await flushDom()

    expect(video.muted).toBe(true)
    expect(video.volume).toBe(0)

    await document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    await flushDom()

    expect(wrapper.find('[data-testid="vibe-media-volume-popover"]').exists()).toBe(false)

    wrapper.unmount()
  })

  it('renders an inline horizontal tablet volume control', async () => {
    setViewportWidth(1_024)
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve())
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})

    const wrapper = mount(Layout, {
      props: createSeededVibeProps([createVideoItem('video-volume-tablet', 'Tablet volume')]),
    })

    await flushDom()

    expect(wrapper.get('[data-testid="vibe-media-volume"]').attributes('data-layout')).toBe('horizontal')

    wrapper.unmount()
  })

  it('requests native fullscreen for the active video from the media controls', async () => {
    setViewportWidth(1_024)
    const requestFullscreen = vi.fn(() => Promise.resolve())
    Object.defineProperty(HTMLVideoElement.prototype, 'requestFullscreen', {
      configurable: true,
      value: requestFullscreen,
    })
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve())
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})

    const wrapper = mount(Layout, {
      props: createSeededVibeProps([createVideoItem('video-native-fullscreen', 'Native fullscreen')]),
    })

    await flushDom()

    await wrapper.get('[data-testid="vibe-media-fullscreen-button"]').trigger('click')
    await flushDom()

    expect(requestFullscreen).toHaveBeenCalledTimes(1)

    wrapper.unmount()
  })

  it('lets native fullscreen video clicks handle playback without also toggling Vibe playback', async () => {
    setViewportWidth(1_024)
    const playSpy = vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve())
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})

    const wrapper = mount(Layout, {
      props: createSeededVibeProps([createVideoItem('video-native-click', 'Native click')]),
    })

    await flushDom()

    const video = wrapper.get('video').element as HTMLVideoElement
    const initialPlayCalls = playSpy.mock.calls.length
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      value: video,
    })

    await wrapper.get('video').trigger('click')
    await flushDom()

    expect(playSpy.mock.calls.length).toBe(initialPlayCalls)

    wrapper.unmount()
  })
})

function createVideoItem(id: string, title: string): VibeViewerItem {
  return {
    id,
    type: 'video',
    title,
    url: `https://example.com/${id}.mp4`,
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

function restoreFullscreenElement() {
  if (DEFAULT_FULLSCREEN_ELEMENT_DESCRIPTOR) {
    Object.defineProperty(Document.prototype, 'fullscreenElement', DEFAULT_FULLSCREEN_ELEMENT_DESCRIPTOR)
    delete (document as Document & { fullscreenElement?: Element | null }).fullscreenElement
    return
  }

  delete (document as Document & { fullscreenElement?: Element | null }).fullscreenElement
}

function restoreRequestFullscreen() {
  if (DEFAULT_REQUEST_FULLSCREEN_DESCRIPTOR) {
    Object.defineProperty(HTMLVideoElement.prototype, 'requestFullscreen', DEFAULT_REQUEST_FULLSCREEN_DESCRIPTOR)
    return
  }

  delete (HTMLVideoElement.prototype as Partial<HTMLVideoElement>).requestFullscreen
}
