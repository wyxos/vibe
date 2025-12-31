import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { h } from 'vue'
import Masonry from '../src/Masonry.vue'

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

  it('animates initial load from container left (-width, finalY) to (finalX, finalY)', async () => {
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
    const widthMatch = /width:\s*([\d.]+)px/i.exec(startStyle)
    expect(widthMatch).toBeTruthy()
    if (!widthMatch) throw new Error('Expected width in start style')
    expect(startStyle).toContain(`translate3d(-${widthMatch[1]}px,0px,0)`)

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

  it('animates appended items from container left (-width, finalY) to (finalX, finalY)', async () => {
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

    // The appended item should first paint at x = -width (not finalX - width).
    const entering = cards[1]
    const enteringStyle = entering.attributes('style') ?? ''
    const enteringWidthMatch = /width:\s*([\d.]+)px/i.exec(enteringStyle)
    expect(enteringWidthMatch).toBeTruthy()
    if (!enteringWidthMatch) throw new Error('Expected width in entering style')
    expect(enteringStyle).toContain(`translate3d(-${enteringWidthMatch[1]}px,0px,0)`)

    // Advance animation.
    for (let i = 0; i < 6 && rafCallbacks.length; i += 1) {
      const cb = rafCallbacks.shift()
      if (cb) cb(0)
    }
    await wrapper.vm.$nextTick()

    const endStyle = entering.attributes('style') ?? ''
    const endXMatch = /translate3d\(\s*([-\d.]+)px\s*,\s*0px\s*,\s*0\s*\)/i.exec(endStyle)
    expect(endXMatch).toBeTruthy()
    if (!endXMatch) throw new Error('Expected translate3d in end style')
    expect(Number(endXMatch[1])).toBeGreaterThan(0)

    wrapper.unmount()
    globalThis.requestAnimationFrame = originalRaf
    globalThis.ResizeObserver = originalResizeObserver
  })
})
