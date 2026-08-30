import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import MediaCard from '@/components/MediaCard.vue'

function props() {
  return {
    active: false,
    entering: false,
    fetchPriority: 'low' as const,
    inViewport: false,
    index: 0,
    item: {
      postId: 15,
      src: 'https://example.com/15.mp4',
      preview: {
        src: 'https://example.com/15-preview.mp4',
        width: 450,
        height: 600,
      },
      width: 900,
      height: 1200,
      items: [],
    },
    layout: 'masonry' as const,
    loadedCount: 1,
    mediaIndex: 0,
    previewState: 'ready' as const,
    total: null,
  }
}

describe('MediaCard viewport playback', () => {
  afterEach(() => vi.restoreAllMocks())

  it('autoplays masonry videos only while they intersect the viewport', async () => {
    const wrapper = mount(MediaCard, { props: props() })
    const video = wrapper.get('video').element as HTMLVideoElement
    const play = vi.spyOn(video, 'play').mockResolvedValue()
    const pause = vi.spyOn(video, 'pause').mockImplementation(() => undefined)

    expect(video.autoplay).toBe(false)
    expect(video.muted).toBe(true)

    await wrapper.setProps({ inViewport: true })
    await wrapper.vm.$nextTick()
    expect(play).toHaveBeenCalledOnce()
    expect(video.autoplay).toBe(true)

    await wrapper.setProps({ inViewport: false })
    expect(pause).toHaveBeenCalledOnce()
    expect(video.autoplay).toBe(false)
    expect(video.muted).toBe(true)

    await wrapper.setProps({ inViewport: true })
    await wrapper.vm.$nextTick()
    expect(play).toHaveBeenCalledTimes(2)
    expect(video.autoplay).toBe(true)
  })
})
