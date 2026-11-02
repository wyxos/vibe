import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import MediaCard from '@/components/MediaCard.vue'

describe('paused native clock synchronization', () => {
  let wrapper: VueWrapper | undefined
  afterEach(() => { wrapper?.unmount(); vi.restoreAllMocks() })

  async function setup() {
    let controlsUpdates = 0
    wrapper = mount(MediaCard, {
      props: {
        entering: false, inViewport: true, fetchPriority: 'high', index: 0, layout: 'masonry',
        loadedCount: 1, mediaIndex: 0, previewState: 'ready', total: null,
        mediaCard: { pauseVideoDuringTransitions: true, videoMuted: true },
        item: { postId: 1, src: 'https://example.test/video.mp4', type: 'video', width: 640, height: 480, items: [] },
      },
      global: { mixins: [{ beforeUpdate() {
        if (this.$options.__name === 'MediaControls') controlsUpdates++
      } }] },
    })
    await flushPromises()
    const media = wrapper.get('video').element
    let duration = 100
    vi.spyOn(media, 'duration', 'get').mockImplementation(() => duration)
    media.dispatchEvent(new Event('loadedmetadata'))
    await flushPromises()
    expect(wrapper.find('.media-controls').exists()).toBe(true)
    const pause = vi.spyOn(media, 'pause').mockImplementation(() => media.dispatchEvent(new Event('pause')))
    const seek = wrapper.get('.media-control-seek').element as HTMLInputElement
    controlsUpdates = 0
    return { media, pause, seek, setDuration: (value: number) => { duration = value },
      count: () => controlsUpdates, reset: () => { controlsUpdates = 0 } }
  }

  it('publishes the exact paused native clock in the exit update before the queued timeupdate', async () => {
    const { media, pause, seek, setDuration, reset, count } = await setup()
    media.dispatchEvent(new Event('playing'))
    await flushPromises()
    media.currentTime = 3.173
    setDuration(120.25)
    reset()
    await wrapper!.setProps({ leaving: true })
    await flushPromises()
    expect(pause).toHaveBeenCalledOnce()
    expect(seek.value).toBe('3.173')
    expect(seek.max).toBe('120.25')
    expect(count()).toBe(1)
    reset()
    media.dispatchEvent(new Event('timeupdate'))
    await flushPromises()
    expect(seek.value).toBe('3.173')
    expect(count()).toBe(0)
    media.currentTime = 4.321
    media.dispatchEvent(new Event('timeupdate'))
    await flushPromises()
    expect(seek.value).toBe('4.321')
    expect(count()).toBe(1)
  })

  it('reads the clock after native pause and never seeks or reloads the media', async () => {
    const { media, pause, seek } = await setup()
    pause.mockImplementation(() => {
      media.currentTime = 5.123
      media.dispatchEvent(new Event('pause'))
    })
    const load = vi.spyOn(media, 'load').mockImplementation(() => undefined)
    const setTime = vi.spyOn(media, 'currentTime', 'set')
    await wrapper!.setProps({ inViewport: false })
    await flushPromises()
    expect(seek.value).toBe('5.123')
    // The one write belongs to the simulated native pause, not synchronization.
    expect(setTime).toHaveBeenCalledExactlyOnceWith(5.123)
    expect(load).not.toHaveBeenCalled()
  })

  it('does not cause a second controls update or input write when the clock is unchanged', async () => {
    const { media, seek, reset, count } = await setup()
    media.currentTime = 2.125
    media.dispatchEvent(new Event('timeupdate'))
    await flushPromises()
    reset()
    const setValue = vi.spyOn(seek, 'value', 'set')
    await wrapper!.setProps({ leaving: true })
    await flushPromises()
    expect(count()).toBe(0)
    media.dispatchEvent(new Event('timeupdate'))
    await flushPromises()
    expect(count()).toBe(0)
    expect(setValue).not.toHaveBeenCalled()
    expect(seek.value).toBe('2.125')
  })
})
