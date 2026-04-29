import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { describe, expect, it } from 'vitest'

import FullscreenSurface from '@/components/FullscreenSurface.vue'
import type { VibeViewerItem } from '@/components/viewer'

describe('FullscreenSurface asset events', () => {
  it('does not preserve load errors emitted by a previous slide after its asset was detached', async () => {
    const items = [
      createImageItem('image-1'),
      createImageItem('image-2'),
    ]
    const wrapper = mount(FullscreenSurface, {
      props: {
        active: true,
        activeIndex: 0,
        items,
      },
    })

    await flushDom()

    await wrapper.setProps({ activeIndex: 1 })
    await flushDom()

    await wrapper.get('[data-testid="vibe-slide"][data-index="0"] img').trigger('error')
    await flushDom()

    await wrapper.setProps({ activeIndex: 0 })
    await flushDom()

    expect(wrapper.get('[data-testid="vibe-slide"][data-index="0"]').attributes('data-active')).toBe('true')
    expect(wrapper.find('[data-testid="vibe-asset-error"]').exists()).toBe(false)

    wrapper.unmount()
  })
})

function createImageItem(id: string): VibeViewerItem {
  return {
    id,
    type: 'image',
    title: id,
    url: `https://example.com/${id}.jpg`,
    width: 1_920,
    height: 1_080,
  }
}

async function flushDom() {
  await nextTick()
  await Promise.resolve()
  await nextTick()
}
