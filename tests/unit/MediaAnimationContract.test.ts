import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import MediaCard from '@/components/MediaCard.vue'

describe('animated media contract', () => {
  it.each(['gif', 'webp', 'apng'])(
    'renders animated %s previews as images without replacing their source',
    (extension) => {
      const source = `https://example.com/animated.${extension}`
      const preview = `https://example.com/animated-preview.${extension}`
      const wrapper = mount(MediaCard, {
        props: {
          active: true,
          entering: false,
          fetchPriority: 'high',
          index: 0,
          item: {
            height: 960,
            items: [],
            postId: 45,
            preview: { height: 480, src: preview, width: 320 },
            src: source,
            width: 640,
          },
          layout: 'masonry',
          loadedCount: 1,
          mediaIndex: 0,
          previewState: 'ready',
          total: null,
        },
      })

      expect(wrapper.find('video').exists()).toBe(false)
      expect(wrapper.get('img').attributes('src')).toBe(preview)
    },
  )
})
