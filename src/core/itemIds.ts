import { isReactive, isReadonly, isRef, isShallow, reactive, toRaw } from 'vue'
import type { VibeItem, VibeItemId } from '../types'

// Cache only stable Vue wrapper identity, never an ID or collection membership.
// A weak key does not retain departed items, even though its raw target is held.
const canonicalTargets = new WeakMap<VibeItem, VibeItem | null>()

function readId(raw: VibeItem, receiver: VibeItem): VibeItemId {
  const id: unknown = Reflect.get(raw, 'postId', receiver)
  if (typeof id === 'string' || typeof id === 'number') return id
  if (isRef(id)) return id.value as VibeItemId
  return receiver.postId
}

/** Read current IDs for imperative operations; membership is never cached.
 * Computed/watch sources must keep their normal reactive property reads. */
export function itemIds(items: readonly VibeItem[]): VibeItemId[] {
  // Optimize the deep mutable runtime array. Other arrays already have cheap
  // reads, or can layer readonly/shallow wrappers with different item semantics.
  if (!isReactive(items) || isReadonly(items) || isShallow(items)) return items.map(item => item.postId)
  const source = toRaw(items)
  if (reactive(source) !== items) return items.map(item => item.postId)
  return source.map(value => {
    const cached = canonicalTargets.get(value)
    if (cached !== undefined) return cached ? readId(cached, value) : value.postId
    const raw = toRaw(value)
    if (raw === value) return readId(raw, reactive(value))
    // Custom wrappers around Vue proxies can override postId. Verify the
    // canonical wrapper once; its target never changes, while its ID can.
    const canonical = reactive(raw) === value
    canonicalTargets.set(value, canonical ? raw : null)
    return canonical ? readId(raw, value) : value.postId
  })
}
