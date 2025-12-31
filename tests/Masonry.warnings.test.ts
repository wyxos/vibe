import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import Masonry from '@/components/Masonry.vue'

function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

describe('Masonry diagnostics', () => {
  it('warns once per item id for invalid width/height', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const getContent = vi.fn(async () => {
      return {
        items: [
          {
            id: 'bad',
            type: 'image',
            reaction: null,
            width: 0,
            height: 240,
            original: 'https://example.com/original.jpg',
            preview: 'https://example.com/preview.jpg',
          },
        ],
        nextPage: null,
      }
    })

    const wrapper = mount(Masonry, {
      attachTo: document.body,
      props: { getContent, page: 1, itemWidth: 300 },
    })

    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(warnSpy).toHaveBeenCalledTimes(1)

    // Trigger a restore path which re-marks enter for the same id.
    await (wrapper.vm as any).remove('bad')
    await wrapper.vm.$nextTick()

    await (wrapper.vm as any).restore('bad')
    await wrapper.vm.$nextTick()

    expect(warnSpy).toHaveBeenCalledTimes(1)

    wrapper.unmount()
    warnSpy.mockRestore()
  })
})
