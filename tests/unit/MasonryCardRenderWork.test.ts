import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, markRaw, nextTick } from 'vue'

import MasonryFeed from '@/components/MasonryFeed.vue'
import MediaCard from '@/components/MediaCard.vue'
import { createMasonryItemStyleCache } from '@/components/masonryItemStyleCache'
import { mediaStateKey } from '@/core/mediaAsset'

const frames = new Map<number, FrameRequestCallback>()
let frameId = 0
let width = 1000

beforeEach(() => {
  frames.clear(); frameId = 0; width = 1000
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { frames.set(++frameId, callback); return frameId })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id))
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => width)
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(500)
  vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(20_000)
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

async function flushFrames() {
  const pending = [...frames.values()]
  frames.clear()
  pending.forEach(callback => callback(16))
  await nextTick()
}

function fixture() {
  const updates: number[] = [], chrome: number[] = []
  const region = markRaw(defineComponent({ props: ['item'], setup: props => () => {
    chrome.push(props.item.postId)
    return h('span', `Synthetic ${props.item.postId}`)
  } }))
  const wrapper = mount(MasonryFeed, {
    props: {
      canRetryEnd: false, enteringPostIds: new Set<number>(), entryDelays: new Map(),
      hasNext: false, infiniteScroll: false, isLoadingMore: false, loadMoreLocked: false,
      mediaIndices: new Map(), nextPageError: false, previewStates: new Map(), total: null,
      cardHeader: { component: region, height: 24 }, cardFooter: { component: region, height: 24 },
      items: Array.from({ length: 100 }, (_, index) => ({
        postId: index + 1, src: `https://example.test/${index + 1}.jpg`, width: 400, height: 400, items: [],
      })),
    },
    global: {
      stubs: { GalleryScrollbar: true },
      mixins: [{ beforeUpdate() {
        if (this.$options.__name === 'MediaCard') updates.push(this.$props.item.postId)
      } }],
    },
  })
  const cards = () => new Map(wrapper.findAllComponents(MediaCard).map(card => [card.props('item').postId, card]))
  return { wrapper, updates, chrome, cards }
}

describe('MasonryFeed retained card render work', () => {
  it('preserves unchanged retained card styles when the mounted row window moves', async () => {
    const f = fixture()
    try {
      await nextTick(); await nextTick(); await flushFrames()
      const before = new Map([...f.cards()].map(([id, card]) => [id, { element: card.element, props: { ...card.props() } }]))
      f.updates.length = 0; f.chrome.length = 0
      const gallery = f.wrapper.get<HTMLElement>('.gallery-shell')
      gallery.element.scrollTop = 1200
      await gallery.trigger('scroll'); await flushFrames()
      const after = f.cards()
      expect([...before.keys()].some(id => !after.has(id))).toBe(true)
      expect([...after.keys()].some(id => !before.has(id))).toBe(true)
      const unchanged = [...before].filter(([id, previous]) => {
        const current = after.get(id)
        return current && Object.entries(previous.props).every(([key, value]) => key === 'itemStyle' || current.props()[key] === value)
      })
      expect(unchanged.length).toBeGreaterThan(0)
      for (const [id, previous] of unchanged) {
        expect(after.get(id)!.element).toBe(previous.element)
        expect(after.get(id)!.props('itemStyle')).toEqual(previous.props.itemStyle)
        expect(f.updates.filter(updated => updated === id)).toHaveLength(0)
        expect(f.chrome.filter(updated => updated === id)).toHaveLength(0)
        expect(after.get(id)!.props('itemStyle')).toBe(previous.props.itemStyle)
      }
    } finally { f.wrapper.unmount() }
  })

  it('refreshes geometry and entry/removal motion while genuine chrome and preview props still update', async () => {
    const f = fixture()
    try {
      await nextTick(); await nextTick(); await flushFrames()
      const card = () => f.cards().get(1)!
      const original = card().props('itemStyle')!
      await f.wrapper.setProps({ enteringPostIds: new Set([1]), entryDelays: new Map([[1, 17]]) })
      const entering = card().props('itemStyle')!
      expect(entering).not.toBe(original)
      expect(entering['--masonry-entry-delay']).toBe('17ms')
      expect(entering.transform).not.toBe(original.transform)
      await f.wrapper.setProps({ entryDelays: new Map([[1, 29]]) })
      expect(card().props('itemStyle')).not.toBe(entering)
      expect(card().props('itemStyle')!['--masonry-entry-delay']).toBe('29ms')
      await f.wrapper.setProps({ enteringPostIds: new Set(), leavingPostIds: new Set([1]), removalDelays: new Map([[1, 41]]) })
      const leaving = card().props('itemStyle')!
      expect(leaving['--masonry-entry-delay']).toBe('41ms')
      expect(card().classes()).toContain('media-card--leaving')
      await f.wrapper.setProps({ removalDelays: new Map([[1, 59]]) })
      expect(card().props('itemStyle')).not.toBe(leaving)
      expect(card().props('itemStyle')!['--masonry-entry-delay']).toBe('59ms')
      await f.wrapper.setProps({ leavingPostIds: new Set(), masonry: { minColumnWidth: 320 } })
      await nextTick()
      const resized = card().props('itemStyle')!
      expect(resized.width).not.toBe(original.width)
      expect((card().element as HTMLElement).style.width).toBe(resized.width)
      await card().get('img').trigger('load')
      f.updates.length = 0
      await f.wrapper.setProps({ previewStates: new Map([[mediaStateKey(1, 0), 'error']]) })
      expect(card().props('itemStyle')).toBe(resized)
      expect(card().classes()).toContain('media-card--error')
      expect(f.updates).toContain(1)
      f.chrome.length = 0
      await f.wrapper.setProps({ items: [...f.wrapper.props('items'), { postId: 101, src: 'https://example.test/101.jpg', width: 400, height: 400, items: [] }] })
      expect(card().props('loadedCount')).toBe(101)
      expect(f.chrome).toContain(1)
    } finally { f.wrapper.unmount() }
  })

  it('drops styles outside the mounted window and invalidates each numeric style input', () => {
    const cache = createMasonryItemStyleCache()
    const geometry = { width: 100, height: 200, x: 10, y: 20 }
    const first = cache.get(0, geometry, 0, 0)
    expect(cache.get(0, { ...geometry }, 0, 0)).toBe(first)
    for (const key of ['width', 'height', 'x', 'y'] as const) {
      expect(cache.get(0, { ...geometry, [key]: geometry[key] + 1 }, 0, 0)).not.toBe(first)
      expect(cache.get(0, geometry, 0, 0)).toEqual(first)
    }
    const offset = cache.get(0, geometry, 30, 0)
    expect(offset.transform).toBe('translate3d(10px, 50px, 0)')
    expect(cache.get(0, geometry, 30, 5)).not.toBe(offset)
    // Traversing a library cannot keep historic style identities alive.
    const retained = cache.get(0, geometry, 0, 0)
    for (let index = 1; index <= 100; index++) {
      cache.retain([index]); cache.get(index, geometry, 0, 0)
    }
    cache.retain([0])
    expect(cache.get(0, geometry, 0, 0)).not.toBe(retained)
  })
})
