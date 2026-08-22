import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import MediaCard from '@/components/MediaCard.vue'
import type { VibeItem } from '@/index'

function audioItem(postId: number, cover = true): VibeItem {
  return {
    postId,
    src: `https://example.com/${postId}.mp3`,
    preview: cover
      ? {
          height: 900,
          src: `https://example.com/${postId}-cover.jpg`,
          type: 'image',
          width: 900,
        }
      : undefined,
    type: 'audio',
    width: null,
    height: null,
    items: [],
  }
}

function cardProps(item: VibeItem, layout: 'masonry' | 'reel') {
  return {
    active: true,
    entering: false,
    fetchPriority: 'high' as const,
    index: 0,
    item,
    layout,
    loadedCount: 1,
    mediaIndex: 0,
    previewState: 'ready' as const,
    total: null,
  }
}

describe('audio media cards', () => {
  afterEach(() => vi.restoreAllMocks())

  it('renders cover art without creating a playback element in masonry', () => {
    const wrapper = mount(MediaCard, {
      props: cardProps(audioItem(1), 'masonry'),
    })

    expect(wrapper.find('audio').exists()).toBe(false)
    expect(wrapper.get('.media-audio-cover').attributes('src'))
      .toBe('https://example.com/1-cover.jpg')
    expect(wrapper.find('.media-controls').exists()).toBe(false)
  })

  it('uses the built-in disc fallback when cover art is absent or fails', async () => {
    const uncovered = mount(MediaCard, {
      props: cardProps(audioItem(2, false), 'masonry'),
    })
    expect(uncovered.find('.media-audio-cover').exists()).toBe(false)
    expect(uncovered.get('.media-audio-fallback svg').exists()).toBe(true)

    const failed = mount(MediaCard, {
      props: cardProps(audioItem(3), 'masonry'),
    })
    await failed.get('.media-audio-cover').trigger('error')
    expect(failed.find('.media-audio-cover').exists()).toBe(false)
    expect(failed.get('.media-audio-fallback svg').exists()).toBe(true)
    expect(failed.find('.media-error').exists()).toBe(false)
  })

  it('plays audio in reels while keeping cover art and audio-labelled controls', async () => {
    const wrapper = mount(MediaCard, {
      props: {
        ...cardProps(audioItem(4), 'reel'),
        advanceOnMediaEnd: true,
      },
    })
    const audio = wrapper.get('audio').element as HTMLAudioElement
    const play = vi.spyOn(audio, 'play').mockResolvedValue()
    const pause = vi.spyOn(audio, 'pause').mockImplementation(() => undefined)
    Object.defineProperty(audio, 'duration', { configurable: true, value: 180 })
    audio.currentTime = 12

    audio.dispatchEvent(new Event('loadedmetadata'))
    await wrapper.vm.$nextTick()

    expect(wrapper.get('.media-audio-cover').attributes('src'))
      .toBe('https://example.com/4-cover.jpg')
    expect(wrapper.get('.media-controls').attributes('aria-label')).toBe('Audio controls')
    expect(wrapper.get('[aria-label="Seek audio"]').exists()).toBe(true)
    expect(wrapper.get('[aria-label="Audio volume"]').exists()).toBe(true)

    await wrapper.get('[aria-label="Play audio"]').trigger('click')
    expect(play).toHaveBeenCalledOnce()
    audio.dispatchEvent(new Event('playing'))
    await wrapper.vm.$nextTick()
    await wrapper.get('[aria-label="Pause audio"]').trigger('click')
    expect(pause).toHaveBeenCalledOnce()

    await wrapper.get('audio').trigger('ended')
    expect(wrapper.emitted('ended')).toEqual([[0]])
  })

  it('keeps playable audio when reel cover art fails', async () => {
    const wrapper = mount(MediaCard, {
      props: cardProps(audioItem(5), 'reel'),
    })
    const audio = wrapper.get('audio')
    await audio.trigger('loadedmetadata')
    await wrapper.get('.media-audio-cover').trigger('error')

    expect(wrapper.get('.media-audio-fallback svg').exists()).toBe(true)
    expect(audio.attributes('src')).toBe('https://example.com/5.mp3')
    expect(wrapper.find('.media-error').exists()).toBe(false)
  })

  it('rebinds shared timed-media state when a reel changes from video to audio', async () => {
    const videoItem: VibeItem = {
      postId: 6,
      src: 'https://example.com/6.mp4',
      preview: { height: 600, src: 'https://example.com/6-preview.mp4', width: 450 },
      type: 'video',
      width: 900,
      height: 1200,
      items: [],
    }
    const wrapper = mount(MediaCard, {
      props: {
        ...cardProps(videoItem, 'reel'),
        reelAudioState: {
          lastAudibleVolume: 0.45,
          muted: true,
          volume: 0.45,
        },
      },
    })
    const video = wrapper.get('video').element as HTMLVideoElement
    video.dispatchEvent(new Event('loadedmetadata'))
    expect(video.volume).toBe(0.45)
    expect(video.muted).toBe(true)

    await wrapper.setProps({ item: audioItem(7) })
    const audio = wrapper.get('audio').element as HTMLAudioElement
    audio.dispatchEvent(new Event('loadedmetadata'))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('video').exists()).toBe(false)
    expect(audio.volume).toBe(0.45)
    expect(audio.muted).toBe(true)
    expect(wrapper.get('.media-controls').attributes('aria-label')).toBe('Audio controls')
  })
})
