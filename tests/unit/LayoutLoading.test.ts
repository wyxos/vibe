import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { describe, expect, it, vi } from 'vitest'

import Layout from '@/components/Layout.vue'
import { createDeferred } from '../helpers/useDataSourceTestUtils'

describe('VibeLayout loading lifecycle', () => {
  it('treats the first unresolved load as initializing instead of empty', async () => {
    const deferred = createDeferred<{ items: [] ; nextPage: string | null }>()

    const wrapper = mount(Layout, {
      props: {
        resolve: vi.fn(() => deferred.promise),
      },
    })

    await flushDom()

    expect(wrapper.text()).toContain('Loading...')
    expect(wrapper.text()).not.toContain('No items available')

    deferred.resolve({ items: [], nextPage: null })
    await flushDom()

    wrapper.unmount()
  })
})

async function flushDom() {
  await nextTick()
  await Promise.resolve()
  await nextTick()
}
