import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  acquireVisiblePostPreload,
  resetVisiblePostPreloadSchedulerForTests,
  visiblePostPreloadSchedulerSnapshot,
  visiblePostPreloadTargets,
} from '@/core/visiblePostPreload'

function asset(name: string, type?: 'audio' | 'image' | 'video') {
  const extension = type === 'video' ? 'mp4' : type === 'audio' ? 'mp3' : 'jpg'
  return {
    src: `https://example.com/${name}.${extension}`,
    preview: {
      src: `https://example.com/${name}-preview.${type === 'video' ? 'mp4' : 'jpg'}`,
      type: type === 'audio' ? 'image' as const : type,
      width: 450,
      height: 600,
    },
    type,
    width: 900,
    height: 1200,
  }
}

function item() {
  return {
    postId: 1,
    ...asset('zero'),
    items: [asset('one'), asset('two'), asset('three'), asset('four')],
  }
}

describe('visible post preload', () => {
  afterEach(() => {
    resetVisiblePostPreloadSchedulerForTests()
    vi.restoreAllMocks()
  })

  it('resolves every other preview in adjacent order', () => {
    expect(visiblePostPreloadTargets(item(), 2, 'preview').map(({ src }) => src))
      .toEqual([
        'https://example.com/three-preview.jpg',
        'https://example.com/one-preview.jpg',
        'https://example.com/four-preview.jpg',
        'https://example.com/zero-preview.jpg',
      ])
  })

  it('uses the selected source and deduplicates repeated URLs', () => {
    const grouped = item()
    grouped.items[1]!.preview.src = grouped.items[0]!.preview.src
    expect(visiblePostPreloadTargets(grouped, 0, 'preview').map(({ src }) => src))
      .toEqual([
        'https://example.com/one-preview.jpg',
        'https://example.com/three-preview.jpg',
        'https://example.com/four-preview.jpg',
      ])
    expect(visiblePostPreloadTargets(grouped, 0, 'original')[0]?.src)
      .toBe('https://example.com/one.jpg')
  })

  it('warms audio cover art without preloading audio playback', () => {
    const grouped = item()
    grouped.items = [asset('track', 'audio'), { ...asset('uncovered', 'audio'), preview: undefined }]

    expect(visiblePostPreloadTargets(grouped, 0, 'preview')).toEqual([
      {
        key: 'image:https://example.com/track-preview.jpg',
        src: 'https://example.com/track-preview.jpg',
        timed: false,
      },
    ])
  })

  it('bounds all warmups and timed-media metadata loads globally', () => {
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => undefined)
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined)
    const created: Element[] = []
    const createElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((name, options) => {
      const element = createElement(name, options)
      if (name === 'img' || name === 'video') created.push(element)
      return element
    })
    const releases = [
      ...Array.from({ length: 5 }, (_, index) => acquireVisiblePostPreload({
        key: `timed:${index}`,
        src: `https://example.com/${index}.mp4`,
        timed: true,
      })),
      ...Array.from({ length: 10 }, (_, index) => acquireVisiblePostPreload({
        key: `image:${index}`,
        src: `https://example.com/${index}.jpg`,
        timed: false,
      })),
    ]

    expect(visiblePostPreloadSchedulerSnapshot()).toMatchObject({
      active: 6,
      activeTimed: 2,
    })
    expect(created.filter((element) => element.tagName === 'VIDEO')).toHaveLength(2)
    expect(created.filter((element) => element.tagName === 'IMG')).toHaveLength(4)
    const video = created.find((element) => element.tagName === 'VIDEO')!
    expect(video.getAttribute('preload')).toBe('metadata')
    expect((video as HTMLVideoElement).muted).toBe(true)
    video.dispatchEvent(new Event('loadedmetadata'))
    expect(created.filter((element) => element.tagName === 'VIDEO')).toHaveLength(3)

    releases.forEach((release) => release())
    expect(visiblePostPreloadSchedulerSnapshot()).toMatchObject({
      active: 0,
      activeTimed: 0,
      entries: [],
    })
  })

  it('decodes low-priority images and shares a retained URL', async () => {
    const created: HTMLImageElement[] = []
    const createElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((name, options) => {
      const element = createElement(name, options)
      if (name === 'img') {
        Object.defineProperty(element, 'decode', {
          configurable: true,
          value: vi.fn().mockResolvedValue(undefined),
        })
        created.push(element as HTMLImageElement)
      }
      return element
    })
    const target = {
      key: 'image:shared',
      src: 'https://example.com/shared.jpg',
      timed: false,
    }
    const first = acquireVisiblePostPreload(target)
    const second = acquireVisiblePostPreload(target)
    expect(created).toHaveLength(1)
    expect(created[0]?.fetchPriority).toBe('low')
    expect(created[0]?.decoding).toBe('async')
    created[0]?.dispatchEvent(new Event('load'))
    await Promise.resolve()
    await Promise.resolve()
    expect(created[0]?.decode).toHaveBeenCalledOnce()
    expect(visiblePostPreloadSchedulerSnapshot().entries[0]).toMatchObject({
      refs: 2,
      state: 'ready',
    })
    first()
    expect(visiblePostPreloadSchedulerSnapshot().entries[0]?.refs).toBe(1)
    second()
    expect(visiblePostPreloadSchedulerSnapshot().entries).toEqual([])
  })

  it('does not retry a failed warmup until every visible owner releases it', () => {
    const created: HTMLImageElement[] = []
    const createElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((name, options) => {
      const element = createElement(name, options)
      if (name === 'img') created.push(element as HTMLImageElement)
      return element
    })
    const target = {
      key: 'image:failure',
      src: 'https://example.com/failure.jpg',
      timed: false,
    }
    const first = acquireVisiblePostPreload(target)
    created[0]?.dispatchEvent(new Event('error'))
    expect(visiblePostPreloadSchedulerSnapshot().entries[0]?.state).toBe('failed')
    const second = acquireVisiblePostPreload(target)
    expect(created).toHaveLength(1)
    first()
    second()
    const third = acquireVisiblePostPreload(target)
    expect(created).toHaveLength(2)
    third()
  })
})
