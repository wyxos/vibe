import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import VibeListCard from '@/components/VibeListCard.vue'
import type { VibeViewerItem } from '@/components/vibeViewer'

describe('VibeListCard', () => {
  let intersectionObservers: MockIntersectionObserver[] = []

  beforeEach(() => {
    intersectionObservers = []
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
    MockIntersectionObserver.instances = intersectionObservers
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('does not attach an image preview until the tile is in view', async () => {
    const wrapper = mount(VibeListCard, {
      props: {
        item: createImageItem('image-1'),
      },
    })

    await flushDom()

    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('[data-testid="vibe-list-card-spinner"]').exists()).toBe(false)

    intersectionObservers[0].trigger(wrapper.element as Element, true, 0.75)
    await flushDom()

    expect(wrapper.get('img').attributes('src')).toBe('https://example.com/image-1-preview.jpg')
    expect(wrapper.get('[data-testid="vibe-list-card-spinner"]').exists()).toBe(true)

    await wrapper.get('img').trigger('load')
    await flushDom()

    expect(wrapper.find('[data-testid="vibe-list-card-spinner"]').exists()).toBe(false)

    wrapper.unmount()
  })

  it('aborts an attached image preview when the tile leaves view', async () => {
    const removeAttribute = vi.spyOn(HTMLImageElement.prototype, 'removeAttribute')
    const srcSetter = vi.spyOn(HTMLImageElement.prototype, 'src', 'set')

    const wrapper = mount(VibeListCard, {
      props: {
        item: createImageItem('image-abort'),
      },
    })

    await flushDom()

    intersectionObservers[0].trigger(wrapper.element as Element, true, 0.75)
    await flushDom()

    expect(wrapper.get('img').attributes('src')).toBe('https://example.com/image-abort-preview.jpg')

    intersectionObservers[0].trigger(wrapper.element as Element, false, 0)
    await flushDom()

    expect(removeAttribute).toHaveBeenCalledWith('src')
    expect(srcSetter).toHaveBeenCalledWith('')
    expect(wrapper.find('img').exists()).toBe(false)

    wrapper.unmount()
  })

  it('autoplays video previews when they enter view and detaches them when they leave', async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve())
    const pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
    const load = vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {})

    const wrapper = mount(VibeListCard, {
      props: {
        item: createVideoItem('video-1'),
      },
    })

    await flushDom()

    expect(wrapper.find('video').exists()).toBe(false)

    intersectionObservers[0].trigger(wrapper.element as Element, true, 0.75)
    await flushDom()

    expect(wrapper.get('video').attributes('src')).toBe('https://example.com/video-1-preview.mp4')

    await wrapper.get('video').trigger('canplay')
    await flushDom()

    expect(play).toHaveBeenCalled()

    intersectionObservers[0].trigger(wrapper.element as Element, false, 0)
    await flushDom()

    expect(pause).toHaveBeenCalled()
    expect(load).toHaveBeenCalled()
    expect(wrapper.find('video').exists()).toBe(false)

    wrapper.unmount()
  })
})

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = []

  constructor(private callback: IntersectionObserverCallback) {
    MockIntersectionObserver.instances.push(this)
  }

  disconnect = vi.fn()
  observe = vi.fn()
  unobserve = vi.fn()
  root = null
  rootMargin = ''
  thresholds = [0]

  takeRecords() {
    return []
  }

  trigger(target: Element, isIntersecting: boolean, intersectionRatio: number) {
    this.callback([
      {
        boundingClientRect: target.getBoundingClientRect(),
        intersectionRatio,
        intersectionRect: target.getBoundingClientRect(),
        isIntersecting,
        rootBounds: null,
        target,
        time: 0,
      },
    ] as IntersectionObserverEntry[], this as unknown as IntersectionObserver)
  }
}

function createImageItem(id: string): VibeViewerItem {
  return {
    id,
    type: 'image',
    title: 'Image tile',
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

function createVideoItem(id: string): VibeViewerItem {
  return {
    id,
    type: 'video',
    title: 'Video tile',
    url: `https://example.com/${id}.mp4`,
    width: 1_920,
    height: 1_080,
    preview: {
      url: `https://example.com/${id}-preview.mp4`,
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
