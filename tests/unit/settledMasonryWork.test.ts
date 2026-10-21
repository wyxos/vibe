import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { computed, defineComponent, h, shallowRef } from 'vue'
import { useSettledMasonryFeedLayout } from '@/components/useSettledMasonryFeedLayout'
import { calculateMasonryLayout } from '@/core/masonry'
import type { VibeItem } from '@/types'

describe('settled masonry retained collection work', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('reads each changed sequence once and retains it across tail-pack frames', () => {
    const frames = new Map<number, FrameRequestCallback>()
    let frameId = 0
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frames.set(++frameId, callback)
      return frameId
    })
    vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id))
    let reads = 0
    const counted = (items: VibeItem[]) => new Proxy(items, {
      get(target, key, receiver) {
        if (typeof key === 'string' && /^\d+$/.test(key)) reads++
        return Reflect.get(target, key, receiver)
      },
    })
    const item = (postId: number): VibeItem => ({ postId, items: [], src: '', width: 400, height: 300 + postId % 3 * 80 })
    const initial = Array.from({ length: 6_500 }, (_, index) => item(index))
    const items = shallowRef(counted(initial))
    const width = shallowRef(1_000)
    let layout!: ReturnType<typeof useSettledMasonryFeedLayout>
    const wrapper = mount(defineComponent({
      setup() {
        layout = useSettledMasonryFeedLayout({
          items: () => items.value, width, gap: shallowRef(8),
          additionalHeight: computed(() => 70), minColumnWidth: computed(() => 220),
          packThroughIndex: () => -1, packUntilBottom: () => 900,
        })
        return () => h('div')
      },
    }))
    try {
      const before = layout.layout.value
      const next = [...initial, ...Array.from({ length: 3_250 }, (_, index) => item(initial.length + index))]
      items.value = counted(next)
      reads = 0
      void layout.layout.value
      // A changed sequence is read once. Prefix comparison and packing operate
      // on that retained copy, not repeatedly through the reactive input array.
      expect(reads).toBeLessThanOrEqual(next.length)
      reads = 0
      while (frames.size) {
        const [id, callback] = frames.entries().next().value!
        frames.delete(id)
        callback(0)
        void layout.layout.value
      }
      expect(reads).toBe(0)
      expect(layout.layout.value.items[0]).toBe(before.items[0])
      expect(layout.layout.value).toEqual(calculateMasonryLayout(next, width.value, {
        gap: 8, additionalHeight: 70, minColumnWidth: 220,
      }))
      // Same-length reorder and replacement must still invalidate packed data.
      items.value = counted([next[1]!, next[0]!, ...next.slice(2, 10)])
      expect(layout.layout.value).toEqual(calculateMasonryLayout(items.value, width.value, {
        gap: 8, additionalHeight: 70, minColumnWidth: 220,
      }))
      width.value = 700
      expect(layout.layout.value).toEqual(calculateMasonryLayout(items.value, width.value, {
        gap: 8, additionalHeight: 70, minColumnWidth: 220,
      }))
    } finally { wrapper.unmount() }
  })
})
