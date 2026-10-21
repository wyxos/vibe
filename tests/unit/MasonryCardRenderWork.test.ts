import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, markRaw, nextTick, toRef, watch, type Ref } from 'vue'

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

function fixture(withChrome = true) {
  const updates: number[] = [], chrome: number[] = []
  const countChanges: Array<{ id: number; before: number; after: number }> = []
  const countRefs: Array<{ id: number; count: Ref<number> }> = []
  const region = markRaw(defineComponent({ props: ['item', 'loadedCount'], setup: props => {
    const count = toRef(props, 'loadedCount')
    countRefs.push({ id: props.item.postId, count })
    watch(count, (after, before) => countChanges.push({ id: props.item.postId, before, after }))
    return () => {
      chrome.push(props.item.postId)
      return h('span', `Synthetic ${props.item.postId} / ${props.loadedCount}`)
    }
  } }))
  const wrapper = mount(MasonryFeed, {
    props: {
      canRetryEnd: false, enteringPostIds: new Set<number>(), entryDelays: new Map(),
      hasNext: false, infiniteScroll: false, isLoadingMore: false, loadMoreLocked: false,
      mediaIndices: new Map(), nextPageError: false, previewStates: new Map(), total: null,
      ...(withChrome ? { cardHeader: { component: region, height: 24 }, cardFooter: { component: region, height: 24 } } : {}),
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
  return { wrapper, updates, chrome, cards, region, countChanges, countRefs }
}

describe('MasonryFeed retained card render work', () => {
  it('retains direct numeric MediaCard counts and reactive custom-region props in reel layout', async () => {
    const changes: number[] = []
    const region = markRaw(defineComponent({ props: { loadedCount: { type: Number, required: true } }, setup: props => {
      const count = toRef(props, 'loadedCount')
      watch(count, value => changes.push(value))
      return () => h('span', count.value)
    } }))
    const wrapper = mount(MediaCard, { props: {
      active: true, entering: false, fetchPriority: 'high', index: 0,
      item: { postId: 1, src: 'https://example.test/1.jpg', width: 400, height: 400, items: [] },
      layout: 'reel', loadedCount: 7, mediaIndex: 0, previewState: 'ready', total: null,
      cardHeader: { component: region, height: 24 }, cardFooter: { component: region, height: 24 },
    } })
    try {
      expect(wrapper.findAllComponents(region).map(value => value.props('loadedCount'))).toEqual([7, 7])
      await wrapper.setProps({ loadedCount: 9 })
      expect(wrapper.findAllComponents(region).map(value => value.props('loadedCount'))).toEqual([9, 9])
      expect(changes).toEqual([9, 9])
    } finally { wrapper.unmount() }
  })

  it.each([true, false])('appends without rerendering unchanged retained cards while preserving numeric chrome count watches (chrome=%s)', async withChrome => {
    const f = fixture(withChrome)
    try {
      await nextTick(); await nextTick(); await flushFrames()
      const before = new Map([...f.cards()].map(([id, card]) => [id, { element: card.element, style: card.props('itemStyle') }]))
      expect(before.size).toBeGreaterThan(0)
      f.updates.length = 0; f.chrome.length = 0
      await f.wrapper.setProps({ items: [...f.wrapper.props('items'), ...Array.from({ length: 25 }, (_, index) => ({
        postId: 101 + index, src: `https://example.test/${101 + index}.jpg`, width: 400, height: 400, items: [],
      }))] })
      await nextTick()
      for (const [id, previous] of before) {
        const card = f.cards().get(id)!
        expect(card.element).toBe(previous.element)
        expect(card.props('itemStyle')).toBe(previous.style)
        if (withChrome) {
          const regions = card.findAllComponents(f.region)
          expect(regions).toHaveLength(2)
          for (const region of regions) {
            expect(region.props('loadedCount')).toBe(125)
            expect(typeof region.props('loadedCount')).toBe('number')
            expect(region.text()).toBe(`Synthetic ${id} / 125`)
          }
          expect(f.countChanges.filter(value => value.id === id)).toEqual([
            { id, before: 100, after: 125 }, { id, before: 100, after: 125 },
          ])
          expect(f.countRefs.filter(value => value.id === id).map(value => value.count.value)).toEqual([125, 125])
        }
      }
      expect(f.updates).toHaveLength(0)
      if (!withChrome) { expect(f.countRefs).toHaveLength(0); expect(f.chrome).toHaveLength(0) }
    } finally { f.wrapper.unmount() }
  })
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
      expect(card().findAllComponents(f.region).map(region => region.props('loadedCount'))).toEqual([101, 101])
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
