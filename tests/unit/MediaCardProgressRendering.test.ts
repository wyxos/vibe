import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, markRaw, nextTick } from 'vue'

import MediaCard from '@/components/MediaCard.vue'

afterEach(() => vi.restoreAllMocks())

function fixture(layout: 'masonry' | 'reel', type: 'video' | 'audio' = 'video') {
  const cardUpdates = vi.fn()
  const headerRender = vi.fn(() => h('span', 'Synthetic header'))
  const footerRender = vi.fn(() => h('span', 'Synthetic footer'))
  const wrapper = mount(MediaCard, {
    props: {
      active: true, inViewport: true, entering: false, fetchPriority: 'high', index: 0,
      item: { postId: 1, src: `https://example.test/media.${type === 'audio' ? 'mp3' : 'mp4'}`, type, items: [] },
      layout, loadedCount: 1, mediaIndex: 0, previewState: 'ready', total: null,
      cardHeader: { height: 24, component: markRaw(defineComponent({ render: headerRender })) },
      cardFooter: { height: 24, component: markRaw(defineComponent({ render: footerRender })) },
    },
    global: {
      // Use the real Transition slot boundary, as in the packaged component.
      stubs: { transition: false },
      mixins: [{ beforeUpdate() { if (this.$options.__name === 'MediaCard') cardUpdates() } }],
    },
  })
  const media = wrapper.get(type).element as HTMLMediaElement
  Object.defineProperty(media, 'duration', { configurable: true, value: 120 })
  return { wrapper, media, cardUpdates, headerRender, footerRender }
}

describe('timed MediaCard render boundary', () => {
  for (const [layout, type] of [['masonry', 'video'], ['reel', 'video'], ['reel', 'audio']] as const) {
    it(`updates ${layout} ${type} progress without rendering the static card`, async () => {
      const f = fixture(layout, type)
      try {
        await f.wrapper.get(type).trigger('loadedmetadata')
        await nextTick()
        // Positive control: this hook must observe a real card/chrome update.
        await f.wrapper.setProps({ loadedCount: 2 })
        expect(f.cardUpdates).toHaveBeenCalled()
        expect(f.headerRender).toHaveBeenCalled()
        f.cardUpdates.mockClear(); f.headerRender.mockClear(); f.footerRender.mockClear()
        for (const time of [1, 7.5, 63]) {
          f.media.currentTime = time
          await f.wrapper.get(type).trigger('timeupdate')
          const seek = f.wrapper.get<HTMLInputElement>('.media-control-seek')
          expect(Number(seek.element.value)).toBe(time)
          expect(seek.attributes('aria-valuetext')).toBe(time === 63 ? '1:03 of 2:00' : time === 7.5 ? '0:07 of 2:00' : '0:01 of 2:00')
          expect(seek.element.style.getPropertyValue('--media-range-progress')).toBe(`${time / 120 * 100}%`)
          if (layout === 'reel') expect(f.wrapper.get('output').text()).toBe(time === 63 ? '1:03 / 2:00' : time === 7.5 ? '0:07 / 2:00' : '0:01 / 2:00')
        }
        expect(f.cardUpdates).not.toHaveBeenCalled()
        expect(f.headerRender).not.toHaveBeenCalled()
        expect(f.footerRender).not.toHaveBeenCalled()
        // Seeking still forwards through controls and immediately refreshes progress.
        const seek = f.wrapper.get<HTMLInputElement>('.media-control-seek')
        await seek.setValue('42')
        expect(f.media.currentTime).toBe(42)
        expect(seek.attributes('aria-valuetext')).toBe('0:42 of 2:00')
        expect(f.cardUpdates).not.toHaveBeenCalled()
      } finally { f.wrapper.unmount() }
    })
  }
})
