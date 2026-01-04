/* eslint-disable max-lines */

import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import Masonry from '@/components/Masonry.vue'
import MasonryItem from '@/components/MasonryItem.vue'

type SlotItem = {
  id: string
  width: number
  height: number
  type?: string
  preview?: string
  original?: string
  [key: string]: unknown
}

type SlotItemContext = { item: SlotItem }
type SlotItemFooterContext = { item: SlotItem; remove: () => void }

function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

describe('Masonry slots + media rendering', () => {
  class ImmediateIntersectionObserver {
    private cb: IntersectionObserverCallback
    constructor(cb: IntersectionObserverCallback) {
      this.cb = cb
    }
    observe(target: Element) {
      this.cb(
        [
          {
            target,
            isIntersecting: true,
            intersectionRatio: 1,
          } as unknown as IntersectionObserverEntry,
        ],
        this as unknown as IntersectionObserver
      )
    }
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return []
    }
  }

  it('renders MasonryItem header/footer definitions and keeps media rendering internal', async () => {
    vi.stubGlobal('IntersectionObserver', ImmediateIntersectionObserver as unknown as typeof IntersectionObserver)

    try {
      const getContent = vi.fn(async () => {
        return {
          items: [
            {
              id: 'img-1',
              type: 'image',
              reaction: null,
              width: 320,
              height: 240,
              original: 'https://picsum.photos/seed/original/1600/1200',
              preview: 'https://picsum.photos/seed/preview/320/240',
            },
            {
              id: 'vid-1',
              type: 'video',
              reaction: null,
              width: 320,
              height: 240,
              original: 'https://example.com/video.mp4',
              preview: 'https://picsum.photos/seed/poster/320/240',
            },
          ],
          nextPage: null,
        }
      })

      const wrapper = mount(Masonry, {
        props: { getContent, page: 1, itemWidth: 300 },
        slots: {
          default: () =>
            h(MasonryItem, null, {
              header: ({ item }: SlotItemContext) =>
                h('div', { 'data-testid': 'slot-item-header' }, `H:${item.id}`),
              footer: ({ item, remove }: SlotItemFooterContext) =>
                h(
                  'button',
                  { 'data-testid': 'slot-item-footer', type: 'button', onClick: remove },
                  `F:${item.id}`
                ),
            }),
        },
        attachTo: document.body,
      })

      await flushPromises()
      await wrapper.vm.$nextTick()

      expect(getContent).toHaveBeenCalledTimes(1)

      const cards = wrapper.findAll('[data-testid="item-card"]')
      expect(cards).toHaveLength(2)

      expect(wrapper.findAll('[data-testid="slot-item-header"]').length).toBe(2)
      expect(wrapper.findAll('[data-testid="slot-item-footer"]').length).toBe(2)

      const img = wrapper.find('img')
      expect(img.exists()).toBe(true)
      expect(img.attributes('src')).toBe('https://picsum.photos/seed/preview/320/240')

      const video = wrapper.find('video')
      expect(video.exists()).toBe(true)
      expect(video.attributes('poster')).toBe('https://picsum.photos/seed/poster/320/240')

      const source = wrapper.find('video source')
      expect(source.exists()).toBe(true)
      expect(source.attributes('src')).toBe('https://example.com/video.mp4')

      // Remove one item via the exposed helper.
      await wrapper.findAll('[data-testid="slot-item-footer"]')[0].trigger('click')
      await wrapper.vm.$nextTick()
      expect(wrapper.findAll('[data-testid="item-card"]').length).toBe(1)

      wrapper.unmount()
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('supports MasonryItem loader/error slots for customizing load + retry UI', async () => {
    vi.stubGlobal('IntersectionObserver', ImmediateIntersectionObserver as unknown as typeof IntersectionObserver)

    try {
      const getContent = vi.fn(async () => {
        return {
          items: [
            {
              id: 'img-1',
              type: 'image',
              reaction: null,
              width: 320,
              height: 240,
              original: 'https://picsum.photos/seed/original/1600/1200',
              preview: 'https://picsum.photos/seed/preview/320/240',
            },
          ],
          nextPage: null,
        }
      })

      const wrapper = mount(Masonry, {
        props: { getContent, page: 1, itemWidth: 300 },
        slots: {
          default: () =>
            h(MasonryItem, null, {
              loader: ({ item }: SlotItemFooterContext) =>
                h('div', { 'data-testid': 'custom-loader' }, `L:${item.id}`),
              error: ({ item, error, retry }: { item: SlotItem; remove: () => void; error: unknown; retry: () => void }) =>
                h(
                  'div',
                  {
                    'data-testid': 'custom-error',
                    'data-has-error': String(error != null),
                  },
                  [
                    h('p', { 'data-testid': 'custom-error-message' }, `E:${item.id}`),
                    h(
                      'button',
                      { type: 'button', 'data-testid': 'custom-retry', onClick: retry },
                      'Try again'
                    ),
                  ]
                ),
            }),
        },
        attachTo: document.body,
      })

      await flushPromises()
      await wrapper.vm.$nextTick()

      expect(getContent).toHaveBeenCalledTimes(1)

      // Custom loader should render instead of the default spinner SVG.
      expect(wrapper.find('[data-testid="custom-loader"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="masonry-loader-spinner"] svg').exists()).toBe(false)

      const img = wrapper.find('img')
      expect(img.exists()).toBe(true)

      await img.trigger('error')
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-testid="custom-error"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="custom-error"]').attributes('data-has-error')).toBe('true')

      // Default retry should not be shown when custom error slot is provided.
      expect(wrapper.find('[data-testid="masonry-loader-retry"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="custom-retry"]').exists()).toBe(true)

      await wrapper.get('[data-testid="custom-retry"]').trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[data-testid="custom-error"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="custom-loader"]').exists()).toBe(true)

      wrapper.unmount()
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('supports fixed header/footer heights via props', async () => {
    const getContent = vi.fn(async () => {
      return {
        items: [
          {
            id: 'img-1',
            type: 'image',
            reaction: null,
            width: 320,
            height: 240,
            original: 'https://picsum.photos/seed/original/1600/1200',
            preview: 'https://picsum.photos/seed/preview/320/240',
          },
        ],
        nextPage: null,
      }
    })

    const wrapper = mount(Masonry, {
      props: { getContent, page: 1, itemWidth: 300, headerHeight: 10, footerHeight: 20 },
      slots: {
        default: () =>
          h(MasonryItem, null, {
            header: ({ item }: SlotItemContext) =>
              h('div', { 'data-testid': 'slot-item-header' }, `H:${item.id}`),
            footer: ({ item }: SlotItemContext) =>
              h('div', { 'data-testid': 'slot-item-footer' }, `F:${item.id}`),
          }),
      },
      attachTo: document.body,
    })

    await flushPromises()
    await wrapper.vm.$nextTick()

    const header = wrapper.get('[data-testid="item-header-container"]')
    const footer = wrapper.get('[data-testid="item-footer-container"]')

    expect(header.attributes('style')).toContain('height: 10px')
    expect(footer.attributes('style')).toContain('height: 20px')

    wrapper.unmount()
  })

  it('animates removal as reverse of enter and moves remaining items smoothly', async () => {
    vi.useFakeTimers()

    const rafCallbacks: FrameRequestCallback[] = []
    const originalRaf = globalThis.requestAnimationFrame
    globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) => {
      rafCallbacks.push(cb)
      return 0
    }) as unknown as typeof globalThis.requestAnimationFrame

    const flushRaf = (max = 10) => {
      let i = 0
      while (rafCallbacks.length && i < max) {
        const cb = rafCallbacks.shift()
        if (cb) cb(0)
        i += 1
      }
    }

    const roCallbacks: ResizeObserverCallback[] = []
    const originalResizeObserver = globalThis.ResizeObserver
    globalThis.ResizeObserver = class {
      private _cb: ResizeObserverCallback
      constructor(cb: ResizeObserverCallback) {
        this._cb = cb
        roCallbacks.push(cb)
      }
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return []
      }
    } as unknown as typeof ResizeObserver

    const getContent = vi.fn(async () => {
      return {
        items: [
          {
            id: 'a',
            type: 'image',
            reaction: null,
            width: 320,
            height: 240,
            original: 'https://picsum.photos/seed/original/1600/1200',
            preview: 'https://picsum.photos/seed/preview/320/240',
          },
          {
            id: 'b',
            type: 'image',
            reaction: null,
            width: 320,
            height: 240,
            original: 'https://picsum.photos/seed/original/1600/1200',
            preview: 'https://picsum.photos/seed/preview/320/240',
          },
        ],
        nextPage: null,
      }
    })

    const wrapper = mount(Masonry, {
      props: { getContent, page: 1, itemWidth: 300, gapX: 16 },
      slots: {
        default: () =>
          h(MasonryItem, null, {
            footer: ({ item, remove }: SlotItemFooterContext) =>
              h(
                'button',
                { type: 'button', 'data-testid': `remove-${item.id}`, onClick: remove },
                'Remove'
              ),
          }),
      },
      attachTo: document.body,
    })

    try {
      // With fake timers, avoid setTimeout-based helpers.
      await Promise.resolve()
      await wrapper.vm.$nextTick()

      // Force multi-column so item 'b' lands at x > 0 and will move to x=0 when 'a' is removed.
      const scroller = wrapper.get('[data-testid="items-scroll-container"]')
      Object.defineProperty(scroller.element, 'clientWidth', { value: 900, configurable: true })
      if (roCallbacks.length) {
        roCallbacks[0]([] as unknown as ResizeObserverEntry[], {} as unknown as ResizeObserver)
      }
      await wrapper.vm.$nextTick()

      const cardsBefore = wrapper.findAll('[data-testid="item-card"]')
      expect(cardsBefore).toHaveLength(2)
      expect(cardsBefore[1].attributes('style')).toContain('translate3d(')

      await wrapper.get('[data-testid="remove-a"]').trigger('click')
      await wrapper.vm.$nextTick()

      // Data cards should drop immediately.
      expect(wrapper.findAll('[data-testid="item-card"]').length).toBe(1)

      const leaving = wrapper.get('[data-testid="item-card-leaving"]')
      const leavingStartStyle = leaving.attributes('style') ?? ''
      const widthMatch = /width:\s*([\d.]+)px/i.exec(leavingStartStyle)
      expect(widthMatch).toBeTruthy()
      if (!widthMatch) throw new Error('Expected width in leaving card style')
      expect(leavingStartStyle).toContain('translate3d(') // starts at fromX

      const translateMatch = /translate3d\(([-\d.]+)px,\s*([-\d.]+)px,\s*0\)/i.exec(leavingStartStyle)
      expect(translateMatch).toBeTruthy()
      if (!translateMatch) throw new Error('Expected translate3d in leaving card style')
      const startX = Number.parseFloat(translateMatch[1])
      const startY = Number.parseFloat(translateMatch[2])

      // Advance RAF scheduling deterministically.
      flushRaf()
      flushRaf()
      await wrapper.vm.$nextTick()

      // Leave animation should move downward (y increases) and keep x the same.
      const leavingDuring = wrapper.get('[data-testid="item-card-leaving"]')
      const leavingDuringStyle = leavingDuring.attributes('style') ?? ''
      const duringMatch = /translate3d\(([-\d.]+)px,\s*([-\d.]+)px,\s*0\)/i.exec(leavingDuringStyle)
      expect(duringMatch).toBeTruthy()
      if (!duringMatch) throw new Error('Expected translate3d in leaving card style')
      const endX = Number.parseFloat(duringMatch[1])
      const endY = Number.parseFloat(duringMatch[2])
      expect(endX).toBeCloseTo(startX)
      expect(endY).toBeGreaterThan(startY)

      const remainingDuringMove = wrapper.get('[data-testid="item-card"]')
      expect(remainingDuringMove.attributes('style')).toContain('transition:')

      // Wait for the leave animation timer (LEAVE_MOTION_MS=600) + buffer.
      vi.advanceTimersByTime(650)
      await wrapper.vm.$nextTick()

      expect(wrapper.findAll('[data-testid="item-card-leaving"]').length).toBe(0)
    } finally {
      wrapper.unmount()
      globalThis.ResizeObserver = originalResizeObserver
      globalThis.requestAnimationFrame = originalRaf
      vi.useRealTimers()
    }
  })

  it('can undo and restore removed items to their originalIndex order', async () => {
    const getContent = vi.fn(async () => {
      return {
        items: [
          {
            id: 'a',
            type: 'image',
            reaction: null,
            width: 320,
            height: 240,
            original: 'https://picsum.photos/seed/a/1600/1200',
            preview: 'https://picsum.photos/seed/a/320/240',
          },
          {
            id: 'b',
            type: 'image',
            reaction: null,
            width: 320,
            height: 240,
            original: 'https://picsum.photos/seed/b/1600/1200',
            preview: 'https://picsum.photos/seed/b/320/240',
          },
          {
            id: 'c',
            type: 'image',
            reaction: null,
            width: 320,
            height: 240,
            original: 'https://picsum.photos/seed/c/1600/1200',
            preview: 'https://picsum.photos/seed/c/320/240',
          },
        ],
        nextPage: null,
      }
    })

    const wrapper = mount(Masonry, {
      props: { getContent, page: 1, itemWidth: 300 },
      slots: {
        default: () =>
          h(MasonryItem, null, {
            header: ({ item }: SlotItemContext) => h('div', { 'data-testid': `hdr-${item.id}` }, item.id),
          }),
      },
      attachTo: document.body,
    })

    await flushPromises()
    await wrapper.vm.$nextTick()

    const headerOrder = () => {
      const cards = wrapper.findAll('[data-testid="item-card"]')
      return cards
        .map((card) => card.find('[data-testid^="hdr-"]').text())
        .join('')
    }

    expect(headerOrder()).toBe('abc')

    // Remove two items in one action (batch).
    await (wrapper.vm as any).remove(['b', 'c'])
    await wrapper.vm.$nextTick()
    expect(headerOrder()).toBe('a')

    // Restore them individually in "wrong" order; should still end up in original order.
    await (wrapper.vm as any).restore('c')
    await wrapper.vm.$nextTick()
    await (wrapper.vm as any).restore('b')
    await wrapper.vm.$nextTick()
    expect(headerOrder()).toBe('abc')

    // Remove again and undo the last removal action.
    await (wrapper.vm as any).remove(['b', 'c'])
    await wrapper.vm.$nextTick()
    expect(headerOrder()).toBe('a')

    await (wrapper.vm as any).undo()
    await wrapper.vm.$nextTick()
    expect(headerOrder()).toBe('abc')

    wrapper.unmount()
  })

  it('can permanently forget removed items so they cannot be restored/undone after parent commits', async () => {
    const getContent = vi.fn(async () => {
      return {
        items: [
          {
            id: 'a',
            type: 'image',
            reaction: null,
            width: 320,
            height: 240,
            original: 'https://picsum.photos/seed/a/1600/1200',
            preview: 'https://picsum.photos/seed/a/320/240',
          },
          {
            id: 'b',
            type: 'image',
            reaction: null,
            width: 320,
            height: 240,
            original: 'https://picsum.photos/seed/b/1600/1200',
            preview: 'https://picsum.photos/seed/b/320/240',
          },
          {
            id: 'c',
            type: 'image',
            reaction: null,
            width: 320,
            height: 240,
            original: 'https://picsum.photos/seed/c/1600/1200',
            preview: 'https://picsum.photos/seed/c/320/240',
          },
        ],
        nextPage: null,
      }
    })

    const wrapper = mount(Masonry, {
      props: { getContent, page: 1, itemWidth: 300 },
      slots: {
        default: () =>
          h(MasonryItem, null, {
            header: ({ item }: SlotItemContext) => h('div', { 'data-testid': `hdr-${item.id}` }, item.id),
          }),
      },
      attachTo: document.body,
    })

    await flushPromises()
    await wrapper.vm.$nextTick()

    const headerOrder = () => {
      const cards = wrapper.findAll('[data-testid="item-card"]')
      return cards.map((card) => card.find('[data-testid^="hdr-"]').text()).join('')
    }

    expect(headerOrder()).toBe('abc')

    // Remove a batch, then parent "commits" only 'b' (no longer restorable).
    await (wrapper.vm as any).remove(['b', 'c'])
    await wrapper.vm.$nextTick()
    expect(headerOrder()).toBe('a')

    await (wrapper.vm as any).forget('b')

    // Restore c works, b should not.
    await (wrapper.vm as any).restore(['b', 'c'])
    await wrapper.vm.$nextTick()
    expect(headerOrder()).toBe('ac')

    // Undo should not resurrect b either.
    await (wrapper.vm as any).undo()
    await wrapper.vm.$nextTick()
    expect(headerOrder()).toBe('ac')

    wrapper.unmount()
  })

  it('renders items when only a header definition is provided', async () => {
    const getContent = vi.fn(async () => {
      return {
        items: [
          {
            id: 'img-1',
            type: 'image',
            width: 320,
            height: 240,
            original: 'https://picsum.photos/seed/original/1600/1200',
            preview: 'https://picsum.photos/seed/preview/320/240',
          },
        ],
        nextPage: null,
      }
    })

    const wrapper = mount(Masonry, {
      props: { getContent, page: 1, itemWidth: 300 },
      slots: {
        default: () =>
          h(MasonryItem, null, {
            header: ({ item }: SlotItemContext) =>
              h('div', { 'data-testid': 'slot-item-header' }, `H:${item.id}`),
          }),
      },
      attachTo: document.body,
    })

    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('img-1')

    wrapper.unmount()
  })

  it('animates initial load from above (finalX, -height) to (finalX, finalY)', async () => {
    const rafCallbacks: FrameRequestCallback[] = []
    const originalRaf = globalThis.requestAnimationFrame
    globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) => {
      rafCallbacks.push(cb)
      return 0
    }) as unknown as typeof globalThis.requestAnimationFrame

    const getContent = vi.fn(async () => {
      return {
        items: [
          {
            id: 'img-1',
            type: 'image',
            reaction: null,
            width: 320,
            height: 240,
            original: 'https://picsum.photos/seed/original/1600/1200',
            preview: 'https://picsum.photos/seed/preview/320/240',
          },
        ],
        nextPage: null,
      }
    })

    const wrapper = mount(Masonry, {
      props: { getContent, page: 1, itemWidth: 300 },
      attachTo: document.body,
      slots: {
        default: () => h(MasonryItem),
      },
    })

    await flushPromises()
    await wrapper.vm.$nextTick()

    const card = wrapper.get('[data-testid="item-card"]')
    const startStyle = card.attributes('style') ?? ''
    const startMatch = /translate3d\(\s*([-\d.]+)px\s*,\s*([-\d.]+)px\s*,\s*0\s*\)/i.exec(
      startStyle
    )
    expect(startMatch).toBeTruthy()
    if (!startMatch) throw new Error('Expected translate3d in start style')
    expect(Number(startMatch[1])).toBe(0)
    expect(Number(startMatch[2])).toBeGreaterThan(0)

    // Run a few RAF ticks to advance the two-RAF animation schedule.
    for (let i = 0; i < 6 && rafCallbacks.length; i += 1) {
      const cb = rafCallbacks.shift()
      if (cb) cb(0)
    }
    await wrapper.vm.$nextTick()

    expect(card.attributes('style')).toContain('translate3d(0px,0px,0)')

    wrapper.unmount()
    globalThis.requestAnimationFrame = originalRaf
  })

  it('animates appended items from below into view', async () => {
    const roCallbacks: ResizeObserverCallback[] = []
    const originalResizeObserver = globalThis.ResizeObserver
    const rafCallbacks: FrameRequestCallback[] = []
    const originalRaf = globalThis.requestAnimationFrame

    globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) => {
      rafCallbacks.push(cb)
      return 0
    }) as unknown as typeof globalThis.requestAnimationFrame

    globalThis.ResizeObserver = class {
      private _cb: ResizeObserverCallback
      constructor(cb: ResizeObserverCallback) {
        this._cb = cb
        roCallbacks.push(cb)
      }
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return []
      }
    } as unknown as typeof ResizeObserver

    const getContent = vi.fn(async (pageToken: unknown) => {
      const token = String(pageToken)
      const makeItem = (id: string) => ({
        id,
        type: 'image',
        reaction: null,
        width: 320,
        height: 240,
        original: 'https://picsum.photos/seed/original/1600/1200',
        preview: 'https://picsum.photos/seed/preview/320/240',
      })

      if (token === '1') return { items: [makeItem('1-0')], nextPage: '2' }
      if (token === '2') return { items: [makeItem('2-0')], nextPage: null }
      return { items: [], nextPage: null }
    })

    const wrapper = mount(Masonry, {
      props: { getContent, page: 1, itemWidth: 300, gapX: 16 },
      attachTo: document.body,
      slots: {
        default: () => h(MasonryItem),
      },
    })

    await flushPromises()
    await wrapper.vm.$nextTick()

    // Force multi-column layout so appended item can land at x > 0.
    const scroller = wrapper.get('[data-testid="items-scroll-container"]')
    Object.defineProperty(scroller.element, 'clientWidth', { value: 900, configurable: true })
    if (roCallbacks.length) {
      roCallbacks[0]([] as unknown as ResizeObserverEntry[], {} as unknown as ResizeObserver)
    }
    await wrapper.vm.$nextTick()

    // Clear initial animation.
    for (let i = 0; i < 6 && rafCallbacks.length; i += 1) {
      const cb = rafCallbacks.shift()
      if (cb) cb(0)
    }
    await wrapper.vm.$nextTick()

    // Trigger load of next page via scroll near bottom.
    Object.defineProperty(scroller.element, 'scrollHeight', { value: 2000, configurable: true })
    Object.defineProperty(scroller.element, 'clientHeight', { value: 1000, configurable: true })
    Object.defineProperty(scroller.element, 'scrollTop', { value: 900, configurable: true })
    await scroller.trigger('scroll')

    await flushPromises()
    await wrapper.vm.$nextTick()

    const cards = wrapper.findAll('[data-testid="item-card"]')
    expect(cards.length).toBe(2)

    // The appended item should first paint below its final position (same finalX, positive Y offset).
    const entering = cards[1]
    const enteringStyle = entering.attributes('style') ?? ''
    const enteringStartMatch = /translate3d\(\s*([-\d.]+)px\s*,\s*([-\d.]+)px\s*,\s*0\s*\)/i.exec(
      enteringStyle
    )
    expect(enteringStartMatch).toBeTruthy()
    if (!enteringStartMatch) throw new Error('Expected translate3d in entering start style')
    expect(Number(enteringStartMatch[2])).toBeGreaterThan(0)

    // Advance animation.
    for (let i = 0; i < 6 && rafCallbacks.length; i += 1) {
      const cb = rafCallbacks.shift()
      if (cb) cb(0)
    }
    await wrapper.vm.$nextTick()

    const endStyle = entering.attributes('style') ?? ''
    const endMatch = /translate3d\(\s*([-\d.]+)px\s*,\s*([-\d.]+)px\s*,\s*0\s*\)/i.exec(endStyle)
    expect(endMatch).toBeTruthy()
    if (!endMatch) throw new Error('Expected translate3d in end style')
    expect(Number(endMatch[1])).toBeGreaterThan(0)
    expect(Number(endMatch[2])).toBe(0)

    // X should remain stable throughout the enter animation.
    expect(Number(enteringStartMatch![1])).toBe(Number(endMatch![1]))

    wrapper.unmount()
    globalThis.requestAnimationFrame = originalRaf
    globalThis.ResizeObserver = originalResizeObserver
  })
})
