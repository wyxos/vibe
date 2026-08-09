import { flushPromises } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createVibe,
  type VibeCursor,
  type VibeFeedFooterProps,
  type VibeInstance,
  type VibeItem,
  type VibePage,
} from '@/index'

function item(postId: number): VibeItem {
  return {
    postId,
    src: `https://example.com/${postId}.jpg`,
    preview: {
      src: `https://example.com/${postId}-preview.jpg`,
      width: 450,
      height: 600,
    },
    width: 900,
    height: 1200,
    items: [],
  }
}

function page(ids: readonly number[], next: VibeCursor): VibePage {
  return { items: ids.map(item), next }
}

describe('provider-neutral feed recovery', () => {
  const instances: VibeInstance[] = []
  let target: HTMLDivElement

  beforeEach(() => {
    target = document.createElement('div')
    document.body.append(target)
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      callback(0)
      return 1
    }))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(500)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(500)
  })

  afterEach(() => {
    instances.splice(0).forEach((instance) => instance.destroy())
    target.remove()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  function track(instance: VibeInstance): VibeInstance {
    instances.push(instance)
    return instance
  }

  it('keeps partial autofill results visible and resumes from their cursor', async () => {
    let footerProps: VibeFeedFooterProps | null = null
    const Footer = defineComponent({
      props: ['actions', 'canRetryEnd', 'showLoadMore', 'state'],
      setup(props) {
        footerProps = props as unknown as VibeFeedFooterProps
        return () => h('footer')
      },
    })
    const loadPage = vi.fn()
      .mockResolvedValueOnce(page([1], 'p2'))
      .mockResolvedValueOnce(page([2], 'p3'))
      .mockRejectedValueOnce(new Error('Provider unavailable'))
      .mockResolvedValueOnce(page([3, 4], 'p4'))
    const instance = track(createVibe({
      autofill: { delayStepMs: 0, pageSize: 4, strategy: 'frontend' },
      feedFooter: { component: Footer },
      loadPage,
      target,
    }))

    await instance.mount()
    await flushPromises()

    expect(instance.getState()).toMatchObject({
      current: 'p2',
      next: 'p3',
      nextPageError: new Error('Provider unavailable'),
    })
    expect(instance.getState().items.map(({ postId }) => postId)).toEqual([1, 2])
    expect(instance.getState().autofill).toMatchObject({
      received: 2, requests: 2, status: 'error',
    })

    await footerProps!.actions.retry()

    expect(loadPage.mock.calls.map(([request]) => request.cursor))
      .toEqual([null, 'p2', 'p3', 'p3'])
    expect(instance.getState().items.map(({ postId }) => postId)).toEqual([1, 2, 3, 4])
    expect(instance.getState()).toMatchObject({ current: 'p3', next: 'p4' })
    expect(instance.getState().autofill).toMatchObject({
      received: 4, requests: 3, status: 'complete',
    })
  })

  it('replays the affected page and stops when it supplies a replacement', async () => {
    const requests: VibeCursor[] = []
    let replaying = false
    const instance = track(createVibe({
      infiniteScroll: false,
      loadPage: async ({ cursor }) => {
        requests.push(cursor)
        if (cursor === null) return page(replaying ? [1, 3] : [1, 2], 'p2')
        return page([4, 5], null)
      },
      removalReconciliation: { pageSize: 2 },
      target,
    }))
    await instance.mount()
    instance.removeMedia({ mediaIndex: 0, postId: 1 })
    replaying = true
    requests.length = 0

    await instance.replenishAfterRemoval()

    expect(requests).toEqual([null])
    expect(instance.getState().items.map(({ postId }) => postId)).toEqual([2, 3])
  })

  it('advances only when replay has no eligible replacement', async () => {
    const requests: VibeCursor[] = []
    const instance = track(createVibe({
      infiniteScroll: false,
      loadPage: async ({ cursor }) => {
        requests.push(cursor)
        return cursor === null ? page([1, 2], 'p2') : page([3, 4], null)
      },
      removalReconciliation: { pageSize: 2 },
      target,
    }))
    await instance.mount()
    instance.removeMedia({ mediaIndex: 0, postId: 1 })
    requests.length = 0

    await instance.replenishAfterRemoval()

    expect(requests).toEqual([null, 'p2'])
    expect(instance.getState().items.map(({ postId }) => postId)).toEqual([2, 3, 4])
  })

  it('rejects a feed target below its provider page size', () => {
    expect(() => createVibe({
      autofill: { pageSize: 19, strategy: 'frontend' },
      initialPage: { items: [], next: null },
      loadPage: vi.fn(),
      removalReconciliation: { pageSize: 20 },
      target,
    })).toThrow(
      'Vibe autofill pageSize must be greater than or equal to removalReconciliation pageSize.',
    )
  })
})
