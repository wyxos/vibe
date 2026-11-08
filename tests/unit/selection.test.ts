import { describe, expect, it, vi } from 'vitest'
import { computed } from 'vue'
import { VibeSelectionController } from '@/core/selection'
import type { VibeItem, VibeItemId } from '@/types'
import type { VibeOrderingOptions, VibeSelectionOptions } from '@/selection'

function item(postId: VibeItemId): VibeItem {
  return { postId, src: `/synthetic/${postId}.svg`, width: 120, height: 180, items: [] }
}

function fixture(selection: boolean | VibeSelectionOptions = true, ordering?: VibeOrderingOptions) {
  let items = [1, 2, 3, 4, 5].map(item)
  const controller = new VibeSelectionController({
    selection, ordering,
    getItems: () => items,
    setItems: (next) => { items = next },
  })
  return {
    controller,
    get items() { return items },
    set items(next: VibeItem[]) { items = next },
    ids: () => items.map(({ postId }) => postId),
  }
}

function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>((done) => { resolve = done })
  return { promise, resolve }
}

describe('feed-level selection', () => {
  it('normalizes identity and exposes independent immutable selection snapshots', () => {
    const { controller } = fixture()
    controller.set([1, '1', 3])
    const snapshot = controller.getSelection()
    expect(snapshot).toEqual({ selectedIds: [1, 3], count: 2 })
    expect(Object.isFrozen(snapshot.selectedIds)).toBe(true)
    controller.toggle('1')
    expect(controller.getSelection().selectedIds).toEqual([3])
    expect(snapshot.selectedIds).toEqual([1, 3])
  })

  it('invalidates computed card selection without scanning all selected IDs', () => {
    const { controller } = fixture()
    const selected = computed(() => controller.isSelected(2))
    expect(selected.value).toBe(false)
    controller.toggle(2)
    expect(selected.value).toBe(true)
    controller.clear()
    expect(selected.value).toBe(false)
  })

  it('retains selections across pages and consumer replacements until explicitly cleared', () => {
    const f = fixture()
    f.controller.set([1, 2, 3])
    f.items = [10, 11, 12, 13, 14].map(item)
    f.controller.toggle(10)
    f.controller.toggle(11)
    f.controller.toggle(12)
    f.controller.toggle(13)
    expect(f.controller.getSelection()).toEqual({ selectedIds: [1, 2, 3, 10, 11, 12, 13], count: 7 })
    f.items = [1, 2, 3, 4, 5].map(item)
    expect(f.controller.isSelected(1)).toBe(true)
    f.controller.clear()
    expect(f.controller.getSelection().count).toBe(0)
  })

  it('retains review labels for selected posts outside the loaded collection', () => {
    const f = fixture({ getLabel: (value) => `Post ${value.postId}` })
    f.controller.toggle(2)
    f.items = []
    expect(f.controller.getLabel(2)).toBe('Post 2')
    f.controller.clear()
    expect(f.controller.getLabel(2)).toBe('2')
  })

  it('notifies only real changes with a selection-only payload', () => {
    const onChange = vi.fn()
    const f = fixture({ onChange })
    const original = f.items
    f.controller.set([1])
    f.controller.set(['1'])
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith({ selectedIds: [1], count: 1 })
    expect(f.items).toBe(original)
  })

  it('does nothing when selection and ordering are disabled', async () => {
    const f = fixture(false)
    f.controller.set([1])
    f.controller.setMode('select')
    f.controller.setMode('arrange')
    expect(f.controller.state.mode).toBe('browse')
    expect(f.controller.state.count).toBe(0)
    expect(await f.controller.reorder(1, 3, 'after')).toBe(false)
  })
})

describe('consumer-confirmed ordering', () => {
  it('moves a selected group in original collection order, including unmounted members', async () => {
    const onReorder = vi.fn()
    const f = fixture(true, { onReorder })
    f.controller.set([4, 2])
    expect(await f.controller.reorder(4, 5, 'after')).toBe(true)
    expect(onReorder).toHaveBeenCalledWith({
      movedPostIds: [2, 4], targetPostId: 5, position: 'after', signal: expect.any(AbortSignal),
    })
    expect(f.ids()).toEqual([1, 3, 5, 2, 4])
    expect(f.controller.getSelection().selectedIds).toEqual([4, 2])
  })

  it('moves only an unselected item without altering the selected group', async () => {
    const f = fixture(true, { onReorder: vi.fn() })
    f.controller.set([2, 4])
    await f.controller.reorder(1, 5, 'before')
    expect(f.ids()).toEqual([2, 3, 4, 1, 5])
    expect(f.controller.getSelection().selectedIds).toEqual([2, 4])
  })

  it('does not allow cross-collection groups or targets inside the moving group', async () => {
    const onReorder = vi.fn()
    const f = fixture(true, { onReorder })
    f.controller.set([1, 99])
    expect(f.controller.getMoveIds(1)).toBeNull()
    expect(await f.controller.reorder(1, 5, 'after')).toBe(false)
    expect(f.controller.state.error).toContain('all selected items')
    f.controller.set([1, 2])
    expect(await f.controller.reorder(1, 2, 'before')).toBe(false)
    expect(onReorder).not.toHaveBeenCalled()
  })

  it('preserves current arrangement on failure and supports retry', async () => {
    const onReorder = vi.fn().mockRejectedValueOnce(new Error('synthetic')).mockResolvedValue(undefined)
    const f = fixture(true, { onReorder })
    f.controller.set([1])
    expect(await f.controller.reorder(1, 4, 'after')).toBe(false)
    expect(f.ids()).toEqual([1, 2, 3, 4, 5])
    expect(f.controller.state.error).toBe('Could not save the new order. Try again.')
    expect(await f.controller.retry()).toBe(true)
    expect(f.ids()).toEqual([2, 3, 4, 1, 5])
    expect(f.controller.state.error).toBeNull()
  })

  it('waits for save and preserves pages appended while saving', async () => {
    const pending = deferred()
    const f = fixture(true, { onReorder: () => pending.promise })
    const operation = f.controller.reorder(1, 4, 'after')
    expect(f.controller.state.busy).toBe(true)
    expect(f.ids()).toEqual([1, 2, 3, 4, 5])
    f.items = [...f.items, item(6)]
    pending.resolve()
    expect(await operation).toBe(true)
    expect(f.ids()).toEqual([2, 3, 4, 1, 5, 6])
  })

  it('ignores late save confirmation after cancellation or a collection switch', async () => {
    let collection = 'first'
    const pending = deferred()
    const f = fixture(true, { collectionKey: () => collection, onReorder: () => pending.promise })
    const operation = f.controller.reorder(1, 4, 'after')
    collection = 'second'
    pending.resolve()
    expect(await operation).toBe(false)
    expect(f.ids()).toEqual([1, 2, 3, 4, 5])
    const next = deferred()
    const g = fixture(true, { onReorder: () => next.promise })
    const cancelled = g.controller.reorder(1, 5, 'after')
    g.controller.cancel()
    next.resolve()
    expect(await cancelled).toBe(false)
    expect(g.ids()).toEqual([1, 2, 3, 4, 5])
    expect(g.controller.state.busy).toBe(false)
  })
})

describe('batch actions', () => {
  it('passes all selected IDs and preserves selection after success and failure', async () => {
    const run = vi.fn().mockRejectedValueOnce(new Error('synthetic')).mockResolvedValue(undefined)
    const f = fixture({ actions: [{ id: 'collect', label: 'Collect', run }] })
    f.controller.set([1, 2, 3, 90, 91, 92, 93])
    expect(await f.controller.runAction('collect')).toBe(false)
    expect(run.mock.calls[0][0]).toEqual([1, 2, 3, 90, 91, 92, 93])
    f.controller.toggle(5)
    expect(await f.controller.retry()).toBe(true)
    expect(run.mock.calls[1][0]).toEqual([1, 2, 3, 90, 91, 92, 93])
    expect(f.controller.state.count).toBe(8)
  })

  it('propagates cancellation and ignores late action errors on destroy', async () => {
    const pending = deferred()
    let signal: AbortSignal | undefined
    const f = fixture({ actions: [{ id: 'collect', label: 'Collect', run: (_ids, context) => {
      signal = context.signal
      return pending.promise
    } }] })
    f.controller.set([1])
    const operation = f.controller.runAction('collect')
    f.controller.destroy()
    expect(signal?.aborted).toBe(true)
    pending.resolve()
    expect(await operation).toBe(false)
    expect(await f.controller.runAction('collect')).toBe(false)
    expect(f.controller.state.error).toBeNull()
  })
})
