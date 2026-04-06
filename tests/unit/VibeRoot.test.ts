import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import VibeRoot from '@/components/VibeRoot.vue'
import type { VibeViewerItem } from '@/components/vibeViewer'

describe('VibeRoot', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('hides the centered title when the active item has no title', () => {
    const wrapper = mount(VibeRoot, {
      props: {
        items: [createImageItem('image-1', undefined)],
      },
    })

    expect(wrapper.find('[data-testid="vibe-root-title"]').exists()).toBe(false)
    expect(wrapper.get('[data-testid="vibe-root-pagination"]').text()).toContain('1 / 1')

    wrapper.unmount()
  })

  it('renders fullscreen images from the main url instead of the preview url', () => {
    const item = createImageItem('image-2', 'Primary visual')
    const wrapper = mount(VibeRoot, {
      props: {
        items: [item],
      },
    })

    expect(wrapper.get('img').attributes('src')).toBe(item.url)
    expect(wrapper.get('[data-testid="vibe-root-title"]').text()).toBe('Primary visual')

    wrapper.unmount()
  })

  it('shows an image spinner until the active image finishes loading', async () => {
    const wrapper = mount(VibeRoot, {
      props: {
        items: [createImageItem('image-3', 'Image loading')],
      },
    })

    expect(wrapper.get('[data-testid="vibe-root-asset-spinner"]').exists()).toBe(true)
    expect(wrapper.get('img').classes()).toContain('opacity-0')

    await wrapper.get('img').trigger('load')

    expect(wrapper.find('[data-testid="vibe-root-asset-spinner"]').exists()).toBe(false)
    expect(wrapper.get('img').classes()).toContain('opacity-100')

    wrapper.unmount()
  })

  it('shows media spinners before video and audio are ready', () => {
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve())
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})

    const videoWrapper = mount(VibeRoot, {
      props: {
        items: [createVideoItem('video-1', 'Video loading')],
      },
    })

    expect(videoWrapper.get('[data-testid="vibe-root-asset-spinner"]').exists()).toBe(true)
    expect(videoWrapper.get('video').classes()).toContain('opacity-0')

    videoWrapper.unmount()

    const audioWrapper = mount(VibeRoot, {
      props: {
        items: [createAudioItem('audio-1', 'Audio loading')],
      },
    })

    expect(audioWrapper.get('[data-testid="vibe-root-asset-spinner"]').exists()).toBe(true)

    audioWrapper.unmount()
  })
})

function createImageItem(id: string, title?: string): VibeViewerItem {
  return {
    id,
    type: 'image',
    title,
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

function createVideoItem(id: string, title?: string): VibeViewerItem {
  return {
    ...createImageItem(id, title),
    type: 'video',
    url: `https://example.com/${id}.mp4`,
  }
}

function createAudioItem(id: string, title?: string): VibeViewerItem {
  return {
    id,
    type: 'audio',
    title,
    url: `https://example.com/${id}.mp3`,
    preview: {
      url: `https://example.com/${id}.mp3`,
    },
  }
}
