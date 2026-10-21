import { computed, isReactive, isReadonly, isShallow, reactive, toRaw, type ComputedRef } from 'vue'

import { createItemSnapshot, type VibeRuntimeState } from './runtime'
import type { VibeItem, VibeItemId } from '../types'

const CHUNK_SIZE = 250
const arrayForEach = Array.prototype.forEach
const arrayIterator = Array.prototype[Symbol.iterator]
type Positions = ReadonlyMap<VibeItemId, number>
interface Chunk {
  readonly items: readonly VibeItem[]
  readonly positions: ComputedRef<Positions>
  canRetain(): boolean
}

function ordinaryArray(items: VibeItem[]): boolean {
  try {
    // Vue instruments the forEach GET; HAS still tracks method replacement.
    if (!Reflect.has(items, 'forEach')) return false
    const raw = toRaw(items)
    return !isReadonly(items) && !isShallow(items) && reactive(raw) === items
      && Object.getPrototypeOf(raw) === Array.prototype
      && !Object.prototype.hasOwnProperty.call(raw, 'forEach')
      && !Object.prototype.hasOwnProperty.call(raw, Symbol.iterator)
      && raw.forEach === arrayForEach && raw[Symbol.iterator] === arrayIterator
  } catch { return false }
}

function trackedIdentity(item: VibeItem): boolean {
  // Canonical own data properties notify Vue on edits. Raw objects, accessors,
  // refs and custom wrappers may change without notifying their existing chunk;
  // refresh those chunks whenever the collection changes, as the full index did.
  try {
    if (!isReactive(item) || isReadonly(item) || isShallow(item)) return false
    const raw = toRaw(item)
    if (reactive(raw) !== item) return false
    const value: unknown = Object.getOwnPropertyDescriptor(raw, 'postId')?.value
    return typeof value === 'string' || typeof value === 'number'
  } catch { return false }
}

function chunk(items: readonly VibeItem[], offset: number): Chunk {
  let retain = false
  const positions = computed(() => {
    const result = new Map<VibeItemId, number>()
    retain = true
    items.forEach((item, index) => {
      const id = item.postId
      if (!result.has(id)) result.set(id, offset + index)
      if (!trackedIdentity(item)) retain = false
    })
    return result
  })
  return { items, positions, canRetain: () => retain }
}

/** Reuse completed reactive chunks across verified appends; IDs stay live. */
export function createMediaLifecycleIndex(state: VibeRuntimeState): (postId: VibeItemId) => number {
  const snapshot = createItemSnapshot(state)
  let previous: readonly VibeItem[] = []
  let chunks: Chunk[] = []
  // Preserve the original forEach contract for noncanonical/readonly/shallow
  // arrays, including caller proxies overriding iteration or indexed access.
  const fallback = computed(() => {
    const result = new Map<VibeItemId, number>()
    const items = state.items
    // Keep the fallback live when an own method is replaced or deleted too.
    Reflect.has(items, 'forEach')
    items.forEach((item, index) => {
      const id = item.postId
      if (!result.has(id)) result.set(id, index)
    })
    return result
  })
  const indices = computed<readonly ComputedRef<Positions>[]>(() => {
    const items = state.items
    const useFallback = () => {
      previous = []
      chunks = []
      return [fallback]
    }
    if (!ordinaryArray(items)) return useFallback()
    const next = snapshot.value
    let append = next.length >= previous.length
    for (let index = 0; index < next.length; index += 1) {
      // Spreading fills holes with undefined; the original forEach skips them.
      if (next[index] === undefined) return useFallback()
      if (append && index < previous.length && previous[index] !== next[index]) append = false
    }
    const completed = append ? Math.floor(previous.length / CHUNK_SIZE) : 0
    const updated: Chunk[] = []
    for (let index = 0; index < completed; index += 1) {
      const old = chunks[index]!
      updated.push(old.canRetain() ? old : chunk(old.items, index * CHUNK_SIZE))
    }
    for (let offset = completed * CHUNK_SIZE; offset < next.length; offset += CHUNK_SIZE) {
      updated.push(chunk(Object.freeze(next.slice(offset, offset + CHUNK_SIZE)), offset))
    }
    previous = next
    chunks = updated
    return chunks.map(value => value.positions)
  })
  return postId => {
    for (const positions of indices.value) {
      const position = positions.value.get(postId)
      if (position !== undefined) return position
    }
    return -1
  }
}
