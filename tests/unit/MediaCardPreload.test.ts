import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import MediaCard from '@/components/MediaCard.vue'

function mediaAsset(name: string) {
  return {
    height: 1200,
    preview: {
      height: 600,
      src: `https://example.com/${name}-preview.jpg`,
      width: 450,
    },
    src: `https://example.com/${name}.jpg`,
    width: 900,
  }
}

function videoAsset(name: string) {
  return {
    ...mediaAsset(name),
    preview: {
      ...mediaAsset(name).preview,
      src: `https://example.com/${name}-preview.mp4`,
    },
    src: `https://example.com/${name}.mp4`,
  }
}

function cardProps() {
  return {
    active: true,
    entering: false,
    fetchPriority: 'high' as const,
    index: 0,
    layout: 'masonry' as const,
    loadedCount: 1,
    mediaCard: { feedPreload: 'replacement' as const },
    mediaIndex: 0,
    previewState: 'loading' as const,
    total: null,
  }
}

describe('MediaCard replacement preloading', () => {
  afterEach(() => vi.restoreAllMocks())

  it('starts only after the current masonry media is ready', async () => {
    const decode = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(HTMLImageElement.prototype, 'decode', {
      configurable: true,
      value: decode,
    })
    const wrapper = mount(MediaCard, {
      props: {
        ...cardProps(),
        item: {
          postId: 10,
          ...mediaAsset('first'),
          items: [mediaAsset('replacement')],
        },
      },
    })

    expect(decode).not.toHaveBeenCalled()
    await wrapper.get('.media-preview').trigger('load')
    await wrapper.setProps({ previewState: 'ready' })

    expect(decode).toHaveBeenCalledOnce()
  })

  it('retains a video preloader until the visible replacement is ready', async () => {
    const load = vi.spyOn(HTMLMediaElement.prototype, 'load')
      .mockImplementation(() => undefined)
    const pause = vi.spyOn(HTMLMediaElement.prototype, 'pause')
      .mockImplementation(() => undefined)
    const first = mediaAsset('first')
    const replacement = videoAsset('replacement')
    const following = mediaAsset('following')
    const wrapper = mount(MediaCard, {
      props: {
        ...cardProps(),
        item: {
          postId: 10,
          ...first,
          items: [replacement, following],
        },
      },
    })

    await wrapper.get('img').trigger('load')
    await wrapper.setProps({ previewState: 'ready' })
    expect(load).toHaveBeenCalledOnce()

    await wrapper.setProps({
      item: {
        postId: 10,
        ...replacement,
        items: [following],
      },
      previewState: 'loading',
    })

    expect(load).toHaveBeenCalledOnce()
    expect(pause).not.toHaveBeenCalled()

    await wrapper.get('video').trigger('loadedmetadata')
    await wrapper.setProps({ previewState: 'ready' })
    expect(pause).toHaveBeenCalledOnce()
    expect(load).toHaveBeenCalledTimes(2)
  })
})
