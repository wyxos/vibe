import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'

import {
  createVibe,
  type VibeFeedFooterProps,
  type VibeInstance,
  type VibeItem,
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

describe('custom feed footer', () => {
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
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(900)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(700)
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

  it('keeps GalleryFooter as the default', async () => {
    const instance = track(createVibe({
      initialPage: { items: [item(1)], next: 'two' },
      loadPage: vi.fn(),
      target,
    }))

    await instance.mount()

    expect(target.querySelector('.gallery-footer')).not.toBeNull()
    expect(target.querySelector('[data-test="consumer-feed-footer"]')).toBeNull()
  })

  it('passes reactive public state and working load, end-retry, and retry actions', async () => {
    let footerProps: VibeFeedFooterProps | null = null
    const ConsumerFooter = defineComponent({
      emits: ['load-more'],
      props: ['actions', 'canRetryEnd', 'state'],
      setup(rawProps, { emit }) {
        footerProps = rawProps as unknown as VibeFeedFooterProps
        return () => h('button', {
          'data-test': 'consumer-feed-footer',
          onClick: () => emit('load-more'),
          type: 'button',
        }, footerProps?.state.loadMoreLocked ? 'paused' : 'ready')
      },
    })
    const loadPage = vi.fn()
      .mockResolvedValueOnce({ items: [item(2)], next: null })
      .mockResolvedValueOnce({ items: [item(2)], next: null })
      .mockResolvedValueOnce({ items: [item(3)], next: null })
    const instance = track(createVibe({
      feedFooter: { component: ConsumerFooter },
      initialPage: { items: [item(1)], next: 'two' },
      loadPage,
      target,
    }))

    await instance.mount()
    await flushPromises()
    expect(target.querySelector('.gallery-footer')).toBeNull()
    expect(footerProps!.canRetryEnd).toBe(true)
    expect(footerProps!.state.items.map(({ postId }) => postId)).toEqual([1])

    target.querySelector<HTMLButtonElement>('[data-test="consumer-feed-footer"]')!.click()
    await flushPromises()
    expect(loadPage).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ cursor: 'two' }),
    )
    expect(footerProps!.state.items.map(({ postId }) => postId)).toEqual([1, 2])

    await footerProps!.actions.retryEnd()
    expect(loadPage).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ cursor: 'two' }),
    )

    await footerProps!.actions.retry()
    expect(loadPage).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ cursor: null }),
    )
    expect(footerProps!.state.items.map(({ postId }) => postId)).toEqual([3])

    instance.setLoadMoreLocked(true)
    await flushPromises()
    expect(footerProps!.state.loadMoreLocked).toBe(true)
    expect(target.querySelector('[data-test="consumer-feed-footer"]')?.textContent)
      .toBe('paused')
  })

  it('lets an emitted autofill-cancel action stop active unlimited work', async () => {
    const ConsumerFooter = defineComponent({
      emits: ['autofill-cancel'],
      setup(_, { emit }) {
        return () => h('button', {
          'data-test': 'cancel-from-footer',
          onClick: () => emit('autofill-cancel'),
          type: 'button',
        }, 'Cancel')
      },
    })
    const loadPage = vi.fn()
      .mockResolvedValueOnce({ items: [item(1)], next: 'two' })
      .mockImplementationOnce(({ signal }: { signal: AbortSignal }) => (
        new Promise((_resolve, reject) => {
          signal.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'))
          })
        })
      ))
    const instance = track(createVibe({
      autofill: {
        strategy: 'frontend',
        pageSize: 3,
        maxAdditionalPages: 'unlimited',
        delayStepMs: 0,
      },
      feedFooter: { component: ConsumerFooter },
      loadPage,
      target,
    }))

    const mounting = instance.mount()
    await flushPromises()
    target.querySelector<HTMLButtonElement>('[data-test="cancel-from-footer"]')!.click()
    await mounting

    expect(instance.getState().autofill.status).toBe('cancelled')
    expect(instance.getState().items).toHaveLength(0)
  })
})
