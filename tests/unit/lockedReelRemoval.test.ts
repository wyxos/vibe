import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { createVibe, type VibeInstance, type VibeItem } from '@/index'

const item = (postId: number): VibeItem => ({
  postId, src: 'data:,fixture', width: 640, height: 360,
  preview: { src: 'data:,fixture', width: 640, height: 360 }, items: [],
})
let instance: VibeInstance
let target: HTMLDivElement
beforeEach(() => {
  target = document.createElement('div')
  document.body.append(target)
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(640)
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(800)
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { callback(0); return 1 })
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
})
afterEach(() => { instance?.destroy(); target.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals() })

async function fixture(layout: 'masonry' | 'reel' = 'masonry', items = [item(1)]) {
  const router = createRouter({ history: createMemoryHistory(), routes: [
    { path: '/feed', component: { render: () => null } },
    { path: '/feed/:id', component: { render: () => null } },
  ] })
  await router.push('/feed')
  const loadPage = vi.fn(async () => ({ items: [item(3)], next: null }))
  instance = createVibe({ target, layout, infiniteScroll: false,
    initialPage: { items, current: 'first', next: 'next', total: 10 }, loadPage,
    routing: { router, feed: '/feed', reel: ({ item }) => `/feed/${item.postId}` },
  })
  instance.setLoadMoreLocked(true)
  await instance.mount()
  await flushPromises()
  if (layout === 'masonry') {
    target.querySelector<HTMLElement>(`[data-post-id="${items.at(-1)!.postId}"]`)!.click()
    await flushPromises()
    expect(instance.getState().reelOrigin).toBe('masonry')
  }
  return { loadPage, router }
}

it.each(['media', 'animated media', 'post', 'batch'])(
  'returns a locked masonry reel to its feed after removing the last %s', async (kind) => {
    const { loadPage, router } = await fixture('masonry', [item(1), item(2)])
    let undo: () => boolean
    if (kind === 'media' || kind === 'animated media') {
      const removal = kind === 'media'
        ? instance.removeMedia({ postId: 2, mediaIndex: 0 })!
        : (await instance.removeMediaAnimated!({ postId: 2, mediaIndex: 0 }))!
      undo = () => instance.restoreMediaRemoval(removal)
    } else {
      const removal = await instance.removeItems(kind === 'batch' ? [1, 2] : [2])
      undo = () => instance.restoreRemoval(removal)
    }
    await flushPromises()
    expect(instance.getState()).toMatchObject({ layout: 'masonry', reelOrigin: null,
      activeReelPostId: null, loadMoreLocked: true, current: 'first', next: 'next',
      reelForward: { status: 'idle', error: null }, nextPageError: null })
    expect(target.querySelector('.reel-feed')).toBeNull()
    expect(router.currentRoute.value.path).toBe('/feed')
    expect(loadPage).not.toHaveBeenCalled()
    expect(undo()).toBe(true)
    await flushPromises()
    expect(instance.getState().items.map(({ postId }) => postId)).toEqual([1, 2])
    expect(instance.getState().reelOrigin).toBeNull()
  },
)

it('leaves an empty locked feed after the only item is reacted to', async () => {
  const { loadPage } = await fixture()
  instance.removeMedia({ postId: 1, mediaIndex: 0 })
  await flushPromises()
  expect(instance.getState()).toMatchObject({ items: [], reelOrigin: null, activeReelPostId: null })
  expect(loadPage).not.toHaveBeenCalled()
})

it('keeps loaded successors available while locked', async () => {
  const { loadPage } = await fixture('reel', [item(1), item(2)])
  instance.removeMedia({ postId: 1, mediaIndex: 0 })
  await flushPromises()
  expect(instance.getState()).toMatchObject({ activeReelPostId: 2, reelForward: { status: 'idle' } })
  expect(loadPage).not.toHaveBeenCalled()
})

it('shows a normal end in a standalone locked reel and can continue after unlocking', async () => {
  const { loadPage } = await fixture('reel')
  instance.removeMedia({ postId: 1, mediaIndex: 0 })
  await flushPromises()
  expect(instance.getState().reelForward).toEqual({ status: 'end', error: null })
  expect(loadPage).not.toHaveBeenCalled()
  instance.setLoadMoreLocked(false)
  await instance.retryReelForward()
  await flushPromises()
  expect(instance.getState()).toMatchObject({ activeReelPostId: 3, reelForward: { status: 'idle' } })
  expect(loadPage).toHaveBeenCalledTimes(1)
})

it('still loads forward when the masonry reel is unlocked', async () => {
  const { loadPage } = await fixture()
  instance.setLoadMoreLocked(false)
  instance.removeMedia({ postId: 1, mediaIndex: 0 })
  await flushPromises()
  expect(instance.getState()).toMatchObject({ reelOrigin: 'masonry', activeReelPostId: 3,
    reelForward: { status: 'idle', error: null } })
  expect(loadPage).toHaveBeenCalledTimes(1)
})
