import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import SearchExample from '@/pages/examples/Search.vue'
import * as fakeServer from '@/fakeServer'

function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

describe('Search example', () => {
  it('reloads Masonry from page 1 on Apply and fetches matching results', async () => {
    const spy = vi
      .spyOn(fakeServer, 'fetchSearchPage')
      .mockResolvedValue({ items: [], nextPage: null } as any)

    const wrapper = mount(SearchExample, { attachTo: document.body })

    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(spy).toHaveBeenCalledTimes(1)
    expect(String(spy.mock.calls[0]?.[0])).toContain('page=1')

    await wrapper.get('[data-testid="search-input"]').setValue('video')
    await wrapper.get('[data-testid="apply-search"]').trigger('click')

    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(spy).toHaveBeenCalledTimes(2)
    expect(String(spy.mock.calls[1]?.[0])).toContain('page=1')
    expect(String(spy.mock.calls[1]?.[0])).toContain('q=video')

    wrapper.unmount()
  })
})
