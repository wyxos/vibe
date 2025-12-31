import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import Masonry from '@/Masonry.vue'

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
  it('renders itemHeader and itemFooter slots and keeps media rendering internal', async () => {
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
        itemHeader: ({ item }: SlotItemContext) =>
          h('div', { 'data-testid': 'slot-item-header' }, `H:${item.id}`),
        itemFooter: ({ item, remove }: SlotItemFooterContext) =>
          h(
            'button',
            { 'data-testid': 'slot-item-footer', type: 'button', onClick: remove },
            `F:${item.id}`
          ),
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
        itemHeader: ({ item }: SlotItemContext) =>
          h('div', { 'data-testid': 'slot-item-header' }, `H:${item.id}`),
        itemFooter: ({ item }: SlotItemContext) =>
          h('div', { 'data-testid': 'slot-item-footer' }, `F:${item.id}`),
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
        itemFooter: ({ item, remove }: SlotItemFooterContext) =>
          h(
            'button',
            { type: 'button', 'data-testid': `remove-${item.id}`, onClick: remove },
            'Remove'
          ),
      },
      attachTo: document.body,
    })

    await flushPromises()
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

    // Move transition is enabled on the next frame; assert it while active.
    await new Promise((resolve) => setTimeout(resolve, 0))
    await new Promise((resolve) => setTimeout(resolve, 0))
    await wrapper.vm.$nextTick()

    const remainingDuringMove = wrapper.get('[data-testid="item-card"]')
    expect(remainingDuringMove.attributes('style')).toContain('transition:')

    // Wait for the leave animation timer (ENTER_FROM_LEFT_MS=300).
    await new Promise((resolve) => setTimeout(resolve, 350))
    await wrapper.vm.$nextTick()

    expect(wrapper.findAll('[data-testid="item-card-leaving"]').length).toBe(0)

    wrapper.unmount()
    globalThis.ResizeObserver = originalResizeObserver
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
        itemHeader: ({ item }: SlotItemContext) =>
          h('div', { 'data-testid': `hdr-${item.id}` }, item.id),
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
    await (wrapper.vm as any).restoreRemoved('c')
    await wrapper.vm.$nextTick()
    await (wrapper.vm as any).restoreRemoved('b')
    await wrapper.vm.$nextTick()
    expect(headerOrder()).toBe('abc')

    // Remove again and undo the last removal action.
    await (wrapper.vm as any).remove(['b', 'c'])
    await wrapper.vm.$nextTick()
    expect(headerOrder()).toBe('a')

    await (wrapper.vm as any).undoLastRemoval()
    await wrapper.vm.$nextTick()
    expect(headerOrder()).toBe('abc')

    wrapper.unmount()
  })

  it('renders the default footer when itemFooter slot is not provided', async () => {
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
        itemHeader: ({ item }) => h('div', { 'data-testid': 'slot-item-header' }, `H:${item.id}`),
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
    expect(Number(startMatch[2])).toBeLessThan(0)

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

  it('animates appended items from above (finalX, finalY - height) to (finalX, finalY)', async () => {
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

    // The appended item should first paint above its final position (same finalX, negative Y offset).
    const entering = cards[1]
    const enteringStyle = entering.attributes('style') ?? ''
    const enteringStartMatch = /translate3d\(\s*([-\d.]+)px\s*,\s*([-\d.]+)px\s*,\s*0\s*\)/i.exec(
      enteringStyle
    )
    expect(enteringStartMatch).toBeTruthy()
    if (!enteringStartMatch) throw new Error('Expected translate3d in entering start style')
    expect(Number(enteringStartMatch[2])).toBeLessThan(0)

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
