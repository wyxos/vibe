import { describe, expect, it, vi } from 'vitest'

import type { VibeViewerItem } from '@/components/vibeViewer'

import { mountUseVibeRoot } from '../helpers/mountUseVibeRoot'

describe('useVibeRoot', () => {
  it('clamps the active index and exposes loading and end-of-feed states', async () => {
    const items = [createImageItem('image-1'), createImageItem('image-2')]
    const viewer = await mountUseVibeRoot({
      items,
      activeIndex: 99,
    })

    expect(viewer.api.resolvedActiveIndex.value).toBe(1)
    expect(viewer.api.isAtEnd.value).toBe(true)
    expect(viewer.api.statusMessage.value).toBe('End of feed')

    viewer.props.items = []
    viewer.props.loading = true
    await viewer.flush()

    expect(viewer.api.resolvedActiveIndex.value).toBe(0)
    expect(viewer.api.statusMessage.value).toBe('Loading the first page')

    viewer.props.items = items
    viewer.props.activeIndex = 0
    viewer.props.hasNextPage = true
    await viewer.flush()

    expect(viewer.api.statusMessage.value).toBe('Loading more items')

    viewer.unmount()
  })

  it('returns a bounded rendered window around the active index', async () => {
    const items = Array.from({ length: 40 }, (_, index) => createImageItem(`image-${index + 1}`))
    const viewer = await mountUseVibeRoot({
      items,
      activeIndex: 12,
    })

    expect(viewer.api.renderedItems.value.map(({ index }) => index)).toEqual([10, 11, 12, 13, 14])

    viewer.props.activeIndex = 0
    await viewer.flush()

    expect(viewer.api.renderedItems.value.map(({ index }) => index)).toEqual([0, 1, 2])

    viewer.props.activeIndex = 39
    await viewer.flush()

    expect(viewer.api.renderedItems.value.map(({ index }) => index)).toEqual([37, 38, 39])

    viewer.unmount()
  })

  it('emits navigation updates for wheel and keyboard input while respecting guards', async () => {
    const viewer = await mountUseVibeRoot({
      items: [createImageItem('image-1'), createImageItem('image-2'), createImageItem('image-3')],
      activeIndex: 1,
    })

    const now = vi.spyOn(Date, 'now')
    now.mockReturnValue(1_000)

    viewer.api.onWheel({
      deltaX: 0,
      deltaY: 64,
      preventDefault: vi.fn(),
      target: document.createElement('div'),
    } as WheelEvent)
    viewer.api.onWheel({
      deltaX: 0,
      deltaY: 64,
      preventDefault: vi.fn(),
      target: document.createElement('div'),
    } as WheelEvent)

    now.mockReturnValue(1_500)

    const editableTarget = document.createElement('input')
    document.body.appendChild(editableTarget)
    editableTarget.dispatchEvent(new KeyboardEvent('keydown', {
      bubbles: true,
      key: 'ArrowDown',
    }))

    const passiveTarget = document.createElement('div')
    document.body.appendChild(passiveTarget)
    passiveTarget.dispatchEvent(new KeyboardEvent('keydown', {
      bubbles: true,
      key: 'ArrowUp',
    }))

    expect(viewer.emitted).toEqual([2, 0])

    viewer.unmount()
  })

  it('syncs media playback with the active item and clamps media seeking', async () => {
    const videoItem = createVideoItem('video-1')
    const audioItem = createAudioItem('audio-1')
    const viewer = await mountUseVibeRoot({
      items: [videoItem, audioItem],
      activeIndex: 0,
    })

    const video = createStubMediaElement('video', {
      currentTime: 6,
      duration: 12,
      paused: true,
    })
    const audio = createStubMediaElement('audio', {
      currentTime: 4,
      duration: 18,
      paused: true,
    })

    viewer.api.registerVideoElement(videoItem.id, video.element)
    viewer.api.registerAudioElement(audioItem.id, audio.element)

    viewer.props.activeIndex = 1
    await viewer.flush()

    expect(audio.play).toHaveBeenCalledTimes(1)
    expect(video.pause).toHaveBeenCalledTimes(1)
    expect(video.currentTime()).toBe(0)
    expect(viewer.api.activeMediaItem.value?.id).toBe(audioItem.id)

    viewer.props.activeIndex = 0
    await viewer.flush()

    expect(video.play).toHaveBeenCalledTimes(1)
    expect(video.element.muted).toBe(true)
    expect(video.element.loop).toBe(false)
    expect(video.element.playsInline).toBe(true)
    expect(audio.pause).toHaveBeenCalledTimes(1)
    expect(audio.currentTime()).toBe(0)

    const seekInput = document.createElement('input')
    seekInput.value = '99'
    viewer.api.onMediaSeekInput({
      target: seekInput,
    } as Event)

    expect(video.currentTime()).toBe(12)
    expect(viewer.api.mediaStates.value[videoItem.id]).toMatchObject({
      currentTime: 12,
      duration: 12,
      paused: false,
    })

    viewer.unmount()
  })

  it('toggles active audio playback from the cover click handler', async () => {
    const audioItem = createAudioItem('audio-toggle')
    const viewer = await mountUseVibeRoot({
      items: [audioItem],
      activeIndex: 0,
    })

    const audio = createStubMediaElement('audio', {
      currentTime: 0,
      duration: 18,
      paused: true,
    })

    viewer.api.registerAudioElement(audioItem.id, audio.element)
    await viewer.flush()

    audio.play.mockClear()
    audio.pause.mockClear()

    viewer.api.onAudioCoverClick({ button: 0 } as MouseEvent, audioItem.id)
    expect(audio.play).toHaveBeenCalledTimes(1)

    viewer.api.onAudioCoverClick({ button: 0 } as MouseEvent, audioItem.id)
    expect(audio.pause).toHaveBeenCalledTimes(1)

    viewer.unmount()
  })

  it('tracks media readiness for video and audio loading states', async () => {
    const videoItem = createVideoItem('video-ready')
    const audioItem = createAudioItem('audio-ready')
    const viewer = await mountUseVibeRoot({
      items: [videoItem, audioItem],
      activeIndex: 0,
    })

    const video = createStubMediaElement('video', {
      currentTime: 0,
      duration: 12,
      paused: true,
    })
    const audio = createStubMediaElement('audio', {
      currentTime: 0,
      duration: 18,
      paused: true,
    })

    viewer.api.registerVideoElement(videoItem.id, video.element)
    viewer.api.registerAudioElement(audioItem.id, audio.element)

    expect(viewer.api.isMediaReady(videoItem.id)).toBe(false)
    expect(viewer.api.isMediaReady(audioItem.id)).toBe(false)

    viewer.api.onMediaEvent(videoItem.id, {
      currentTarget: video.element,
      type: 'canplay',
    } as Event)
    viewer.api.onMediaEvent(audioItem.id, {
      currentTarget: audio.element,
      type: 'canplay',
    } as Event)

    expect(viewer.api.isMediaReady(videoItem.id)).toBe(true)
    expect(viewer.api.isMediaReady(audioItem.id)).toBe(true)

    viewer.api.onMediaEvent(videoItem.id, {
      currentTarget: video.element,
      type: 'waiting',
    } as Event)

    expect(viewer.api.isMediaReady(videoItem.id)).toBe(false)

    viewer.unmount()
  })

  it('keeps the custom seekbar state at the requested time until the media catches up', async () => {
    const videoItem = createVideoItem('video-laggy')
    const viewer = await mountUseVibeRoot({
      items: [videoItem],
      activeIndex: 0,
    })

    const video = createStubMediaElement('video', {
      currentTime: 0,
      duration: 12,
      paused: false,
      delaySeekUpdates: true,
    })

    viewer.api.registerVideoElement(videoItem.id, video.element)

    const seekInput = document.createElement('input')
    seekInput.value = '7.5'
    viewer.api.onMediaSeekInput({
      target: seekInput,
    } as Event)

    expect(video.currentTime()).toBe(0)
    expect(viewer.api.mediaStates.value[videoItem.id]).toMatchObject({
      currentTime: 7.5,
      duration: 12,
      paused: false,
    })

    video.flushPendingSeek()
    viewer.api.onMediaEvent(videoItem.id, {
      currentTarget: video.element,
    } as Event)

    expect(viewer.api.mediaStates.value[videoItem.id]?.currentTime).toBe(7.5)

    viewer.unmount()
  })
})

function createImageItem(id: string): VibeViewerItem {
  return {
    id,
    type: 'image',
    title: `${id} title`,
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
    ...createImageItem(id),
    type: 'video',
    url: `https://example.com/${id}.mp4`,
  }
}

function createAudioItem(id: string): VibeViewerItem {
  return {
    id,
    type: 'audio',
    title: `${id} title`,
    url: `https://example.com/${id}.mp3`,
    preview: {
      url: `https://example.com/${id}.mp3`,
    },
  }
}

function createStubMediaElement(
  tagName: 'audio' | 'video',
  options: {
    currentTime: number
    duration: number
    paused: boolean
    delaySeekUpdates?: boolean
  },
) {
  const element = document.createElement(tagName) as HTMLMediaElement
  let currentTimeValue = options.currentTime
  let pausedValue = options.paused
  let pendingSeekValue: number | null = null

  const play = vi.fn().mockImplementation(() => {
    pausedValue = false
    return Promise.resolve()
  })
  const pause = vi.fn().mockImplementation(() => {
    pausedValue = true
  })

  Object.defineProperties(element, {
    currentTime: {
      configurable: true,
      get: () => currentTimeValue,
      set: (value: number) => {
        if (options.delaySeekUpdates) {
          pendingSeekValue = value
          return
        }

        currentTimeValue = value
      },
    },
    duration: {
      configurable: true,
      get: () => options.duration,
    },
    pause: {
      configurable: true,
      value: pause,
    },
    paused: {
      configurable: true,
      get: () => pausedValue,
    },
    play: {
      configurable: true,
      value: play,
    },
  })

  return {
    element: tagName === 'video' ? element as HTMLVideoElement : element as HTMLAudioElement,
    play,
    pause,
    currentTime: () => currentTimeValue,
    flushPendingSeek: () => {
      if (pendingSeekValue == null) {
        return
      }

      currentTimeValue = pendingSeekValue
      pendingSeekValue = null
    },
  }
}
