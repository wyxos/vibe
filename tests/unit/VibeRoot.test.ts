import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import VibeRoot from '@/components/VibeRoot.vue'
import type { VibeViewerItem } from '@/components/vibeViewer'

describe('VibeRoot', () => {
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
