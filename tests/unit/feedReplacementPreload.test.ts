import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  preloadFeedVariant,
  replacementFeedVariant,
} from '@/core/feedReplacementPreload'
import type { VibeItem, VibeMediaAsset } from '@/types'

function asset(name: string, type?: 'image' | 'video'): VibeMediaAsset {
  const extension = type === 'video' ? 'mp4' : 'jpg'
  return {
    height: 1200,
    preview: {
      height: 600,
      src: `https://example.com/${name}-preview.${extension}`,
      type,
      width: 450,
    },
    src: `https://example.com/${name}.${extension}`,
    type,
    width: 900,
  }
}

function item(): VibeItem {
  return {
    ...asset('first'),
    items: [asset('middle'), asset('last')],
    postId: 10,
  }
}

describe('feed replacement preload', () => {
  afterEach(() => vi.restoreAllMocks())

  it.each([
    [0, 'middle-preview.jpg'],
    [1, 'last-preview.jpg'],
    [2, 'middle-preview.jpg'],
  ])('resolves the visible replacement after removing media %i', (index, source) => {
    expect(replacementFeedVariant(item(), index, 'preview')?.src).toContain(source)
  })

  it('uses the selected feed source variant', () => {
    expect(replacementFeedVariant(item(), 0, 'original')?.src)
      .toBe('https://example.com/middle.jpg')
  })

  it('decodes replacement images at low priority', () => {
    const decode = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('Image', class {})
    Object.defineProperty(HTMLImageElement.prototype, 'decode', {
      configurable: true,
      value: decode,
    })
    const created: HTMLImageElement[] = []
    const createElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag, options) => {
      const element = createElement(tag, options)
      if (tag === 'img') created.push(element as HTMLImageElement)
      return element
    })

    preloadFeedVariant(asset('next').preview)

    expect(created.at(-1)?.src).toBe('https://example.com/next-preview.jpg')
    expect(created.at(-1)?.fetchPriority).toBe('low')
    expect(decode).toHaveBeenCalledOnce()
  })

  it('preloads one muted replacement video and releases it', () => {
    const load = vi.spyOn(HTMLMediaElement.prototype, 'load')
      .mockImplementation(() => undefined)
    const pause = vi.spyOn(HTMLMediaElement.prototype, 'pause')
      .mockImplementation(() => undefined)
    const videos: HTMLVideoElement[] = []
    const createElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tag, options) => {
      const element = createElement(tag, options)
      if (tag === 'video') videos.push(element as HTMLVideoElement)
      return element
    })

    const dispose = preloadFeedVariant(asset('next', 'video').preview)
    const video = videos.at(-1)!

    expect(video.src).toBe('https://example.com/next-preview.mp4')
    expect(video.muted).toBe(true)
    expect(video.preload).toBe('auto')
    expect(load).toHaveBeenCalledOnce()

    dispose()
    expect(pause).toHaveBeenCalledOnce()
    expect(video.getAttribute('src')).toBeNull()
    expect(load).toHaveBeenCalledTimes(2)
  })
})
