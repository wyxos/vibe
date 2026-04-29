import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'

import Layout from '@/components/Layout.vue'
import type { VibeViewerItem } from '@/components/viewer'
import type { VibeHandle } from '@/components/viewer-core/useViewer'
import { createSeededVibeProps } from '../helpers/createSeededVibeProps'
import { createSimpleItem } from '../helpers/useDataSourceTestUtils'

const DEFAULT_VIEWPORT_WIDTH = window.innerWidth

describe('VibeLayout items-change event', () => {
  afterEach(() => {
    setViewportWidth(DEFAULT_VIEWPORT_WIDTH)
    vi.restoreAllMocks()
  })

  it('emits Vibe-owned visible item changes', async () => {
    setViewportWidth(1_280)

    const wrapper = mount(Layout, {
      props: createSeededVibeProps([
        createSimpleItem('image-change-1'),
        createSimpleItem('image-change-2'),
        createSimpleItem('image-change-3'),
      ]),
    })

    await flushDom()

    const handle = wrapper.vm as unknown as VibeHandle
    handle.remove('image-change-2')
    await flushDom()

    const itemChangeEvents = wrapper.emitted('items-change') ?? []
    const latestItems = itemChangeEvents.at(-1)?.[0] as VibeViewerItem[]

    expect(latestItems.map((item) => item.id)).toEqual(['image-change-1', 'image-change-3'])

    wrapper.unmount()
  })
})

async function flushDom() {
  await nextTick()
  await Promise.resolve()
  await nextTick()
}

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: width,
  })
  window.dispatchEvent(new Event('resize'))
}
