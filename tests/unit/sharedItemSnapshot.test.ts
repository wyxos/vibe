import { describe, expect, it } from 'vitest'
import { reactive } from 'vue'
import { createItemSnapshot, type VibeRuntimeState } from '@/core/runtime'
import type { VibeItem } from '@/types'

describe('shared item snapshots', () => {
  it('materializes one immutable sequence for independent readers of a runtime', () => {
    let iterations = 0
    const items: VibeItem[] = [{ postId: 1, src: '', items: [] }]
    Object.defineProperty(items, Symbol.iterator, { configurable: true, writable: true, value() {
      iterations++
      return Array.prototype[Symbol.iterator].call(this)
    } })
    const state = reactive({ items }) as VibeRuntimeState
    const first = createItemSnapshot(state)
    const second = createItemSnapshot(state)
    const before = first.value
    expect(second.value).toBe(before)
    expect(Object.isFrozen(before)).toBe(true)
    expect(iterations).toBe(1)
    state.items.push({ postId: 2, src: '', items: [] })
    const after = second.value
    expect(first.value).toBe(after)
    expect(after.map(item => item.postId)).toEqual([1, 2])
    expect(before.map(item => item.postId)).toEqual([1])
    expect(iterations).toBe(2)
    state.items[0]!.src = 'data:,updated'
    expect(first.value).toBe(after)
    expect(after[0]!.src).toBe('data:,updated')
  })

  it('isolates runtime instances and follows collection replacement', () => {
    const first = reactive({ items: [{ postId: 1, src: '', items: [] }] }) as VibeRuntimeState
    const second = reactive({ items: [{ postId: 2, src: '', items: [] }] }) as VibeRuntimeState
    const one = createItemSnapshot(first), two = createItemSnapshot(second)
    const before = one.value
    expect(two.value).not.toBe(before)
    first.items = [{ postId: 3, src: '', items: [] }]
    expect(one.value.map(item => item.postId)).toEqual([3])
    expect(createItemSnapshot(first).value).toBe(one.value)
    expect(two.value.map(item => item.postId)).toEqual([2])
    expect(before.map(item => item.postId)).toEqual([1])
  })
})
