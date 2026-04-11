import { createApp, defineComponent, h, nextTick, reactive } from 'vue'
import { describe, expect, it, vi } from 'vitest'

import type { VibeViewerItem } from '@/components/viewer'
import { getVibeOccurrenceKey } from '@/components/viewer-core/itemIdentity'
import { useViewer, type VibeViewerProps } from '@/components/viewer-core/useViewer'

describe('useViewer', () => {
  it('clamps the active index and exposes loading and end-of-feed states', async () => {
    const items = [createImageItem('image-1'), createImageItem('image-2')]
    const viewer = await mountViewer({
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
    const viewer = await mountViewer({
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
    const viewer = await mountViewer({
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
    const viewer = await mountViewer({
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

    const resolvedVideoKey = getVibeOccurrenceKey(viewer.api.items.value[0])
    const resolvedAudioKey = getVibeOccurrenceKey(viewer.api.items.value[1])

    viewer.api.registerVideoElement(resolvedVideoKey, video.element)
    viewer.api.registerAudioElement(resolvedAudioKey, audio.element)

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
    expect(viewer.api.mediaStates.value[resolvedVideoKey]).toMatchObject({
      currentTime: 12,
      duration: 12,
      paused: false,
    })

    viewer.unmount()
  })

  it('toggles active audio playback from the cover click handler', async () => {
    const audioItem = createAudioItem('audio-toggle')
    const viewer = await mountViewer({
      items: [audioItem],
      activeIndex: 0,
    })

    const audio = createStubMediaElement('audio', {
      currentTime: 0,
      duration: 18,
      paused: true,
    })

    const resolvedAudioKey = getVibeOccurrenceKey(viewer.api.items.value[0])

    viewer.api.registerAudioElement(resolvedAudioKey, audio.element)
    await viewer.flush()

    audio.play.mockClear()
    audio.pause.mockClear()

    viewer.api.onAudioCoverClick({ button: 0 } as MouseEvent, resolvedAudioKey)
    expect(audio.play).toHaveBeenCalledTimes(1)

    viewer.api.onAudioCoverClick({ button: 0 } as MouseEvent, resolvedAudioKey)
    expect(audio.pause).toHaveBeenCalledTimes(1)

    viewer.unmount()
  })

  it('tracks media readiness for video and audio loading states', async () => {
    const videoItem = createVideoItem('video-ready')
    const audioItem = createAudioItem('audio-ready')
    const viewer = await mountViewer({
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

    const resolvedVideoKey = getVibeOccurrenceKey(viewer.api.items.value[0])
    const resolvedAudioKey = getVibeOccurrenceKey(viewer.api.items.value[1])

    viewer.api.registerVideoElement(resolvedVideoKey, video.element)
    viewer.api.registerAudioElement(resolvedAudioKey, audio.element)

    expect(viewer.api.isMediaReady(resolvedVideoKey)).toBe(false)
    expect(viewer.api.isMediaReady(resolvedAudioKey)).toBe(false)

    viewer.api.onMediaEvent(resolvedVideoKey, {
      currentTarget: video.element,
      type: 'canplay',
    } as Event)
    viewer.api.onMediaEvent(resolvedAudioKey, {
      currentTarget: audio.element,
      type: 'canplay',
    } as Event)

    expect(viewer.api.isMediaReady(resolvedVideoKey)).toBe(true)
    expect(viewer.api.isMediaReady(resolvedAudioKey)).toBe(true)

    viewer.api.onMediaEvent(resolvedVideoKey, {
      currentTarget: video.element,
      type: 'waiting',
    } as Event)

    expect(viewer.api.isMediaReady(resolvedVideoKey)).toBe(false)

    viewer.unmount()
  })

  it('keeps the custom seekbar state at the requested time until the media catches up', async () => {
    const videoItem = createVideoItem('video-laggy')
    const viewer = await mountViewer({
      items: [videoItem],
      activeIndex: 0,
    })

    const video = createStubMediaElement('video', {
      currentTime: 0,
      duration: 12,
      paused: false,
      delaySeekUpdates: true,
    })

    const resolvedVideoKey = getVibeOccurrenceKey(viewer.api.items.value[0])

    viewer.api.registerVideoElement(resolvedVideoKey, video.element)

    const seekInput = document.createElement('input')
    seekInput.value = '7.5'
    viewer.api.onMediaSeekInput({
      target: seekInput,
    } as Event)

    expect(video.currentTime()).toBe(0)
    expect(viewer.api.mediaStates.value[resolvedVideoKey]).toMatchObject({
      currentTime: 7.5,
      duration: 12,
      paused: false,
    })

    video.flushPendingSeek()
    viewer.api.onMediaEvent(resolvedVideoKey, {
      currentTarget: video.element,
    } as Event)

    expect(viewer.api.mediaStates.value[resolvedVideoKey]?.currentTime).toBe(7.5)

    viewer.unmount()
  })

  it('does not mark a hidden image as ready before it has a real source', async () => {
    const imageItem = createImageItem('image-hidden')
    const viewer = await mountViewer({
      items: [imageItem],
      activeIndex: 0,
    })

    const hiddenImage = document.createElement('img')

    Object.defineProperties(hiddenImage, {
      complete: {
        configurable: true,
        get: () => true,
      },
      currentSrc: {
        configurable: true,
        get: () => '',
      },
    })

    const resolvedImageKey = getVibeOccurrenceKey(viewer.api.items.value[0])

    viewer.api.registerImageElement(resolvedImageKey, hiddenImage)
    expect(viewer.api.isImageReady(resolvedImageKey)).toBe(false)

    hiddenImage.setAttribute('src', imageItem.url)
    viewer.api.registerImageElement(resolvedImageKey, hiddenImage)
    expect(viewer.api.isImageReady(resolvedImageKey)).toBe(true)

    viewer.unmount()
  })
})

async function mountViewer(initialProps: VibeViewerProps) {
  const emitted: number[] = []
  const props = reactive({
    activeIndex: 0,
    hasNextPage: false,
    loading: false,
    paginationDetail: null,
    ...initialProps,
  }) as VibeViewerProps

  let api!: ReturnType<typeof useViewer>

  const container = document.createElement('div')
  document.body.appendChild(container)

  const app = createApp(defineComponent({
    setup() {
      api = useViewer(props, (_event, value) => {
        emitted.push(value)
      })

      return () => h('div')
    },
  }))

  app.mount(container)
  await flushViewer()

  return {
    api,
    emitted,
    props,
    flush: flushViewer,
    unmount() {
      app.unmount()
      container.remove()
    },
  }
}

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

async function flushViewer() {
  await nextTick()
  await Promise.resolve()
  await nextTick()
}
