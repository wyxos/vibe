import { describe, expect, it, vi } from 'vitest'
import { reactive, readonly, ref, shallowReactive, shallowReadonly } from 'vue'
import { itemIds } from '@/core/itemIds'
import { appendUniqueItems, appendUniqueItemsIfChanged, reconcilePageItems } from '@/core/page'
import type { VibeItem, VibeItemId } from '@/types'

function item(postId: VibeItemId): VibeItem {
  return { postId, src: '/synthetic.jpg', width: 10, height: 10, items: [] }
}

describe('imperative live item identities', () => {
  it('reads every current identity again after edits, removal, reorder and restore', () => {
    let reads = 0
    const values = Array.from({ length: 250 }, (_, id) => id)
    const items = reactive(values.map((_, index) => ({
      ...item(index),
      get postId() { reads++; return values[index]! },
    })))
    expect(itemIds(items)).toEqual(values)
    expect(reads).toBe(250)
    values[249] = 999
    expect(itemIds(items).at(-1)).toBe(999)
    expect(reads).toBe(500)
    const removed = items.splice(0, 1)[0]!
    items.reverse()
    expect(itemIds(items)).toEqual(values.slice(1).reverse())
    items.splice(1, 0, removed)
    expect(itemIds(items)[1]).toBe(0)
    expect(reads).toBe(999)
  })

  it('keeps current live duplicates and number/string identities during append', () => {
    const current = reactive([item(1), item('1'), item(2)])
    current[0]!.postId = 3
    const added = item(1), duplicate = item(3)
    const combined = appendUniqueItemsIfChanged(current, [added, duplicate, item('1')])
    expect(combined.map(owner => owner.postId)).toEqual([3, '1', 2, 1])
    expect(combined[0]).toBe(current[0])
    expect(combined.at(-1)).toBe(added)
    expect(appendUniqueItemsIfChanged(current, [duplicate])).toBe(current)
    current.splice(0, 1)
    expect(appendUniqueItems(current, [duplicate]).map(owner => owner.postId)).toEqual(['1', 2, 3])
  })

  it('reads current proxy identities inside an immutable public snapshot', () => {
    const current = reactive([item(1), item(2)])
    const snapshot = Object.freeze([...current])
    expect(itemIds(snapshot)).toEqual([1, 2])
    current[0]!.postId = 'updated'
    expect(itemIds(snapshot)).toEqual(['updated', 2])
  })

  it('preserves accessor receivers and live fields beneath them', () => {
    const receivers: unknown[] = []
    const source = { ...item(1), backingId: 1,
      get postId() { receivers.push(this); return this.backingId },
    }
    const items = reactive([source])
    const proxy = items[0]!
    expect(itemIds(items)).toEqual([1])
    expect(receivers).toEqual([proxy])
    proxy.backingId = 2
    expect(itemIds(items)).toEqual([2])
    expect(receivers).toEqual([proxy, proxy])
  })

  it('preserves custom proxy reads below a Vue wrapper', () => {
    const receivers: unknown[] = []
    const custom = new Proxy(item(1), {
      get(target, key, receiver) {
        if (key === 'postId') { receivers.push(receiver); return 'custom' }
        return Reflect.get(target, key, receiver)
      },
    })
    const items = reactive([custom])
    expect(itemIds(items)).toEqual(['custom'])
    expect(receivers).toEqual([items[0]])
  })

  it('preserves custom overrides around an existing Vue proxy', () => {
    const inner = reactive(item(1))
    const read = vi.fn(() => 'outer-custom')
    const custom = new Proxy(inner, {
      get(target, key, receiver) {
        return key === 'postId' ? read() : Reflect.get(target, key, receiver)
      },
    })
    expect(itemIds(reactive([custom]))).toEqual(['outer-custom'])
    expect(read).toHaveBeenCalledOnce()
  })

  it('preserves caller-owned array map and index overrides around Vue arrays', () => {
    const inner = reactive([item(1)])
    const replacement = item('array-override')
    const custom = new Proxy(inner, {
      get(target, key, receiver) {
        if (key === 'map') return Array.prototype.map
        if (key === '0') return replacement
        return Reflect.get(target, key, receiver)
      },
    })
    expect(itemIds(custom)).toEqual(['array-override'])
  })

  it('retains readonly and shallow array read semantics', () => {
    const source = [{ ...item(1), backingId: 1, get postId() { return this.backingId } }]
    const arrays = [readonly(source), readonly(reactive(source)), shallowReactive(source), shallowReadonly(source)]
    for (const items of arrays) expect(itemIds(items)).toEqual(items.map(owner => owner.postId))
    source[0]!.backingId = 2
    for (const items of arrays) expect(itemIds(items)).toEqual([2])
  })

  it('retains Vue ref-valued identity unwrapping', () => {
    const identity = ref(1)
    const items = reactive([{ ...item(1), postId: identity }])
    expect(itemIds(items)).toEqual([1])
    identity.value = 2
    expect(itemIds(items)).toEqual([2])
  })

  it('uses fresh identities when reconciling an arriving grouped page', () => {
    const current = reactive([item(1), item(2)])
    current[0]!.postId = 3
    const changed = reconcilePageItems(current, [
      { ...item(3), mediaId: 'additional', src: '/additional.jpg' }, item(1),
    ])
    expect(changed.map(owner => owner.postId)).toEqual([3, 2, 1])
    expect(changed[0]?.items).toHaveLength(1)
    expect(changed[0]?.items[0]?.mediaId).toBe('additional')
  })
})
