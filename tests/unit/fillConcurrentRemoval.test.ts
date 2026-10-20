import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createVibe, type VibeInstance, type VibeItem, type VibePage } from '@/index'

const item = (postId: number): VibeItem => ({
  postId, src: 'data:,fixture', width: 400, height: 600, items: [],
})
const page = (ids: number[], next: number | null): VibePage => ({ items: ids.map(item), next })
function deferred() {
  let resolve!: (page: VibePage) => void
  let reject!: (cause: Error) => void
  const promise = new Promise<VibePage>((accept, decline) => { resolve = accept; reject = decline })
  return { promise, resolve, reject }
}

describe('frontend fill with concurrent reactions', () => {
  let instance: VibeInstance
  let target: HTMLDivElement
  beforeEach(() => {
    target = document.createElement('div')
    document.body.append(target)
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(900)
  })
  afterEach(() => { instance?.destroy(); target.remove(); vi.restoreAllMocks() })

  async function setup() {
    const second = deferred(), third = deferred(), fourth = deferred()
    const loadPage = vi.fn().mockResolvedValueOnce(page([2, 3], 2))
      .mockReturnValueOnce(second.promise).mockReturnValueOnce(third.promise)
      .mockReturnValueOnce(fourth.promise)
    instance = createVibe({ target, initialPage: page([1], 1), loadPage,
      infiniteScroll: false, fill: { strategy: 'frontend', delayStepMs: 0 } })
    await instance.mount()
    return { second, third, fourth, loadPage }
  }
  const ids = () => instance.getState().items.map(value => value.postId)

  it('keeps two reacted cards removed across each appended page and final completion', async () => {
    const { second, third } = await setup()
    const filling = instance.fill({ pages: 3 })
    await flushPromises()
    await instance.removeItems([2, 3], { staggerMs: 0 })
    expect(ids()).toEqual([1])
    second.resolve(page([4], 3))
    await flushPromises()
    expect(ids()).toEqual([1, 4])
    third.resolve(page([5], 4))
    await filling
    expect(ids()).toEqual([1, 4, 5])
    expect(instance.getState().fill.completedPages).toBe(3)
  })

  it('fills to the live item count after both initial and newly loaded items are removed', async () => {
    const { second, third, fourth, loadPage } = await setup()
    const filling = instance.fill({ items: 5 })
    await flushPromises()
    await instance.removeItems([1, 2], { staggerMs: 0 })
    second.resolve(page([2, 4], 3)) // A repeated removed item stays excluded.
    await flushPromises()
    expect(ids()).toEqual([3, 4])
    third.resolve(page([5, 6], 4))
    await flushPromises()
    expect(instance.getState().fill.status).toBe('filling')
    expect(loadPage).toHaveBeenCalledTimes(4)
    fourth.resolve(page([7], null))
    await filling
    expect(ids()).toEqual([3, 4, 5, 6, 7])
  })

  it('restores an undone reaction once while another removed card stays hidden', async () => {
    const { second, third } = await setup()
    const filling = instance.fill({ pages: 3 })
    await flushPromises()
    const removal = await instance.removeItems([2], { staggerMs: 0 })
    await instance.removeItems([3], { staggerMs: 0 })
    instance.restoreRemoval(removal)
    second.resolve(page([4], 3))
    await flushPromises()
    third.resolve(page([5], null))
    await filling
    expect(ids()).toEqual([1, 2, 4, 5])
  })

  it('does not revive reacted cards when a later page fails', async () => {
    const { second } = await setup()
    const filling = instance.fill({ pages: 3 })
    const failure = expect(filling).rejects.toThrow('Fixture failure')
    await flushPromises()
    await instance.removeItems([2, 3], { staggerMs: 0 })
    second.reject(new Error('Fixture failure'))
    await failure
    expect(ids()).toEqual([1])
  })
})
