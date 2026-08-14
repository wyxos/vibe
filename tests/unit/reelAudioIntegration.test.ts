import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import MediaCard from '@/components/MediaCard.vue'
import { createVibe, type VibeInstance, type VibeItem } from '@/index'

function videoItem(postId: number): VibeItem {
  return {
    postId,
    src: `https://example.com/${postId}.mp4`,
    preview: {
      src: `https://example.com/${postId}-preview.mp4`,
      width: 450,
      height: 600,
    },
    width: 900,
    height: 1200,
    items: [],
  }
}

describe('reel audio integration', () => {
  const instances: VibeInstance[] = []

  afterEach(() => {
    instances.splice(0).forEach((instance) => instance.destroy())
    document.body.innerHTML = ''
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('applies and publishes controlled audio from a reel card', async () => {
    const wrapper = mount(MediaCard, {
      props: {
        active: true,
        entering: false,
        fetchPriority: 'high',
        index: 0,
        item: videoItem(15),
        layout: 'reel',
        loadedCount: 1,
        mediaIndex: 0,
        previewState: 'ready',
        reelAudioState: {
          lastAudibleVolume: 0.35,
          muted: true,
          volume: 0.35,
        },
        total: null,
      },
    })
    const video = wrapper.get('video').element as HTMLVideoElement
    video.dispatchEvent(new Event('loadedmetadata'))
    await wrapper.vm.$nextTick()
    expect(video.volume).toBe(0.35)
    expect(video.muted).toBe(true)

    await wrapper.setProps({
      reelAudioState: {
        lastAudibleVolume: 0.6,
        muted: false,
        volume: 0.6,
      },
    })
    expect(video.volume).toBe(0.6)
    expect(video.muted).toBe(false)

    await wrapper.get('[aria-label="Video volume"]').setValue('0.4')
    expect(wrapper.emitted('reelAudioChange')?.at(-1)?.[0]).toEqual({
      lastAudibleVolume: 0.4,
      muted: false,
      volume: 0.4,
    })
    await wrapper.get('[aria-label="Mute video"]').trigger('click')
    expect(wrapper.emitted('reelAudioChange')?.at(-1)?.[0]).toEqual({
      lastAudibleVolume: 0.4,
      muted: true,
      volume: 0.4,
    })
  })

  it('shares user changes through the Vibe instance without echoing external sync', async () => {
    const target = document.createElement('div')
    document.body.append(target)
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      callback(0)
      return 1
    }))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(500)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(500)
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined)
    const onReelAudioStateChange = vi.fn()
    const instance = createVibe({
      target,
      layout: 'reel',
      initialPage: { items: [videoItem(1), videoItem(2)], next: null },
      initialReelAudioState: {
        lastAudibleVolume: 0.45,
        muted: true,
        volume: 0.45,
      },
      onReelAudioStateChange,
    })
    instances.push(instance)
    await instance.mount()
    await flushPromises()
    const video = target.querySelector<HTMLVideoElement>('video')!
    video.dispatchEvent(new Event('loadedmetadata'))
    await flushPromises()
    expect(video.volume).toBe(0.45)
    expect(video.muted).toBe(true)

    instance.setReelAudioState({
      lastAudibleVolume: 0.7,
      muted: false,
      volume: 0.7,
    })
    await flushPromises()
    expect(video.volume).toBe(0.7)
    expect(video.muted).toBe(false)
    expect(onReelAudioStateChange).not.toHaveBeenCalled()

    const volume = target.querySelector<HTMLInputElement>('[aria-label="Video volume"]')!
    volume.value = '0.35'
    volume.dispatchEvent(new Event('input', { bubbles: true }))
    await flushPromises()
    expect(onReelAudioStateChange).toHaveBeenLastCalledWith({
      lastAudibleVolume: 0.35,
      muted: false,
      volume: 0.35,
    })
    expect(instance.getReelAudioState().volume).toBe(0.35)
  })
})
