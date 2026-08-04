import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, markRaw } from 'vue'

import MediaCard from '@/components/MediaCard.vue'

function mediaAsset(name: string) {
  return {
    src: `https://example.com/${name}.jpg`,
    preview: {
      src: `https://example.com/${name}-preview.jpg`,
      width: 450,
      height: 600,
    },
    width: 900,
    height: 1200,
  }
}

function videoAsset(name: string) {
  return {
    ...mediaAsset(name),
    src: `https://example.com/${name}.mp4`,
    preview: {
      ...mediaAsset(name).preview,
      src: `https://example.com/${name}-preview.mp4`,
    },
  }
}

function props() {
  return {
    active: true,
    entering: false,
    fetchPriority: 'high' as const,
    index: 0,
    item: {
      postId: 10,
      ...mediaAsset('10'),
      items: [mediaAsset('10-a'), mediaAsset('10-b')],
    },
    layout: 'reel' as const,
    loadedCount: 1,
    mediaIndex: 0,
    previewState: 'ready' as const,
    total: null,
  }
}

describe('MediaCard', () => {
  afterEach(() => {
    document.querySelectorAll('[data-test="stationary-controls-target"]')
      .forEach((element) => element.remove())
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('clears the card backdrop behind transparent chrome regions', async () => {
    const Region = markRaw(defineComponent(() => (
      () => h('span', 'Region')
    )))
    const wrapper = mount(MediaCard, {
      props: {
        ...props(),
        cardHeader: {
          background: 'transparent',
          component: Region,
          height: 32,
        },
        layout: 'masonry',
      },
    })

    expect(wrapper.classes()).toContain('media-card--transparent-chrome')
    expect(wrapper.get('.media-card-header').classes())
      .toContain('media-card-region--transparent')
    expect(wrapper.get('.media-card-media').classes())
      .toContain('media-card-media')

    await wrapper.setProps({
      cardHeader: {
        background: 'default',
        component: Region,
        height: 32,
      },
    })

    expect(wrapper.classes()).not.toContain('media-card--transparent-chrome')
  })

  it('handles repeated horizontal wheel gestures without using deltaY as a fallback', async () => {
    vi.useFakeTimers()
    const wrapper = mount(MediaCard, { props: props() })
    const media = wrapper.get('.media-card-media')

    media.element.dispatchEvent(new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      deltaMode: 1,
      deltaX: 0,
      deltaY: 3,
      shiftKey: true,
    }))
    expect(wrapper.emitted('mediaChange')).toBeUndefined()

    function dispatchHorizontal(deltaY = 0): WheelEvent {
      const event = new WheelEvent('wheel', {
        bubbles: true,
        cancelable: true,
        deltaMode: 1,
        deltaX: 1,
        deltaY,
      })
      media.element.dispatchEvent(event)
      return event
    }

    expect(dispatchHorizontal(3).defaultPrevented).toBe(true)
    expect(wrapper.emitted('mediaChange')).toBeUndefined()
    dispatchHorizontal(3)
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('mediaChange')).toEqual([[1]])

    dispatchHorizontal()
    dispatchHorizontal()
    expect(wrapper.emitted('mediaChange')).toEqual([[1]])

    await wrapper.setProps({ mediaIndex: 1 })
    vi.advanceTimersByTime(160)
    dispatchHorizontal()
    dispatchHorizontal()
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('mediaChange')).toEqual([[1], [2]])
  })

  it('cycles grouped media with a horizontal wheel gesture in masonry', async () => {
    const wrapper = mount(MediaCard, {
      props: { ...props(), layout: 'masonry' },
    })
    const event = new WheelEvent('wheel', {
      bubbles: true,
      cancelable: true,
      deltaX: 100,
    })

    wrapper.get('.media-card-media').element.dispatchEvent(event)
    await wrapper.vm.$nextTick()

    expect(event.defaultPrevented).toBe(true)
    expect(wrapper.emitted('mediaChange')).toEqual([[1]])
  })

  it('tracks the direction used by the grouped-media slide transition', async () => {
    const wrapper = mount(MediaCard, { props: props() })

    await wrapper.get('[aria-label="Next media for post 10"]').trigger('click')
    expect(wrapper.get('.media-card-media').attributes('data-media-direction')).toBe('next')

    await wrapper.setProps({ mediaIndex: 1 })
    expect(wrapper.get('.media-card-frame').attributes('data-media-index')).toBe('1')

    await wrapper.get('[aria-label="Previous media for post 10"]').trigger('click')
    expect(wrapper.get('.media-card-media').attributes('data-media-direction')).toBe('previous')
    expect(wrapper.emitted('mediaChange')).toEqual([[1], [0]])
  })

  it('controls video playback, seeking, volume, mute, and time display', async () => {
    const wrapper = mount(MediaCard, {
      props: {
        ...props(),
        item: {
          postId: 11,
          ...videoAsset('11'),
          items: [],
        },
      },
    })
    const video = wrapper.get('video').element as HTMLVideoElement
    const play = vi.spyOn(video, 'play').mockResolvedValue()
    const pause = vi.spyOn(video, 'pause').mockImplementation(() => undefined)
    Object.defineProperty(video, 'duration', { configurable: true, value: 125 })
    video.currentTime = 5
    video.volume = 0.8
    video.muted = false

    video.dispatchEvent(new Event('loadedmetadata'))
    await wrapper.vm.$nextTick()

    expect(wrapper.get('.media-controls').classes()).toContain('media-controls--reel')
    expect([...wrapper.get('.media-controls-row').element.children].map((element) => (
      element.className
    ))).toEqual([
      'media-control-button media-control-playback',
      'media-controls-audio',
      'media-control-time',
    ])
    expect(wrapper.get('.media-control-time').text()).toBe('0:05 / 2:05')

    await wrapper.get('[aria-label="Seek video"]').setValue('61')
    expect(video.currentTime).toBe(61)

    await wrapper.get('[aria-label="Video volume"]').setValue('0.4')
    expect(video.volume).toBe(0.4)
    expect(video.muted).toBe(false)

    await wrapper.get('[aria-label="Mute video"]').trigger('click')
    expect(video.muted).toBe(true)
    await wrapper.get('[aria-label="Unmute video"]').trigger('click')
    expect(video.muted).toBe(false)

    await wrapper.get('[aria-label="Play video"]').trigger('click')
    expect(play).toHaveBeenCalledOnce()
    video.dispatchEvent(new Event('playing'))
    await wrapper.vm.$nextTick()
    await wrapper.get('[aria-label="Pause video"]').trigger('click')
    expect(pause).toHaveBeenCalledOnce()

    await wrapper.setProps({ layout: 'masonry' })
    expect(wrapper.get('.media-controls').classes()).toContain('media-controls--masonry')
    expect(wrapper.find('[aria-label="Seek video"]').exists()).toBe(true)
    expect(wrapper.find('.media-controls-row').exists()).toBe(false)
    expect(wrapper.find('[aria-label="Play video"]').exists()).toBe(false)
    expect(wrapper.find('[aria-label="Video volume"]').exists()).toBe(false)
    expect(wrapper.find('.media-control-time').exists()).toBe(false)
  })

  it('mutes masonry and inactive reel videos while active reels start unmuted', () => {
    const reelWrapper = mount(MediaCard, {
      props: {
        ...props(),
        active: true,
        item: {
          postId: 11,
          ...videoAsset('11'),
          items: [],
        },
      },
    })
    const masonryWrapper = mount(MediaCard, {
      props: {
        ...props(),
        layout: 'masonry',
        item: {
          postId: 12,
          ...videoAsset('12'),
          items: [],
        },
      },
    })
    const inactiveReelWrapper = mount(MediaCard, {
      props: {
        ...props(),
        active: false,
        item: {
          postId: 14,
          ...videoAsset('14'),
          items: [],
        },
      },
    })
    const configuredMasonryWrapper = mount(MediaCard, {
      props: {
        ...props(),
        layout: 'masonry',
        item: {
          postId: 13,
          ...videoAsset('13'),
          items: [],
        },
        mediaCard: { videoMuted: false },
      },
    })

    expect((reelWrapper.get('video').element as HTMLVideoElement).muted).toBe(false)
    expect((masonryWrapper.get('video').element as HTMLVideoElement).muted).toBe(true)
    expect((inactiveReelWrapper.get('video').element as HTMLVideoElement).autoplay)
      .toBe(false)
    expect((inactiveReelWrapper.get('video').element as HTMLVideoElement).muted)
      .toBe(true)
    expect(
      (configuredMasonryWrapper.get('video').element as HTMLVideoElement).muted,
    ).toBe(false)
  })

  it('pauses and mutes inactive reel videos without losing the user mute state', async () => {
    const wrapper = mount(MediaCard, {
      props: {
        ...props(),
        active: true,
        item: {
          postId: 14,
          ...videoAsset('14'),
          items: [],
        },
      },
    })
    const video = wrapper.get('video').element as HTMLVideoElement
    const play = vi.spyOn(video, 'play').mockResolvedValue()
    const pause = vi.spyOn(video, 'pause').mockImplementation(() => undefined)

    expect(video.autoplay).toBe(true)
    expect(video.muted).toBe(false)

    await wrapper.setProps({ active: false })
    expect(pause).toHaveBeenCalledOnce()
    expect(video.autoplay).toBe(false)
    expect(video.muted).toBe(true)

    await wrapper.setProps({ active: true })
    await wrapper.vm.$nextTick()
    expect(play).toHaveBeenCalledOnce()
    expect(video.autoplay).toBe(true)
    expect(video.muted).toBe(false)
  })

  it('ports active reel controls to their stationary host', async () => {
    const controlsTarget = document.createElement('div')
    controlsTarget.dataset.test = 'stationary-controls-target'
    document.body.appendChild(controlsTarget)
    const wrapper = mount(MediaCard, {
      props: {
        ...props(),
        active: true,
        item: {
          postId: 11,
          ...videoAsset('11'),
          items: [],
        },
        reelControlsTarget: controlsTarget,
        stationaryReelControls: true,
      },
    })
    const video = wrapper.get('video').element as HTMLVideoElement
    const play = vi.spyOn(video, 'play').mockResolvedValue()
    vi.spyOn(video, 'pause').mockImplementation(() => undefined)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.media-controls').exists()).toBe(false)
    expect(controlsTarget.querySelector('.media-controls')).not.toBeNull()
    expect(controlsTarget.querySelector('.media-controls')?.getAttribute(
      'data-control-post-id',
    )).toBe('11')

    controlsTarget.querySelector<HTMLButtonElement>('[aria-label="Play video"]')?.click()
    await wrapper.vm.$nextTick()
    expect(play).toHaveBeenCalledOnce()

    await wrapper.setProps({ active: false })
    expect(controlsTarget.querySelector('.media-controls')).toBeNull()

    wrapper.unmount()
    expect(controlsTarget.querySelector('.media-controls')).toBeNull()
  })

  it('stops looping and reports completion when media drives auto advance', async () => {
    const wrapper = mount(MediaCard, {
      props: {
        ...props(),
        advanceOnMediaEnd: true,
        item: {
          postId: 11,
          ...videoAsset('11'),
          items: [],
        },
      },
    })
    const video = wrapper.get('video')

    expect(video.attributes('loop')).toBeUndefined()
    await video.trigger('ended')
    expect(wrapper.emitted('ended')).toEqual([[0]])

    await wrapper.setProps({ advanceOnMediaEnd: false })
    expect(wrapper.get('video').attributes()).toHaveProperty('loop')
  })
})
