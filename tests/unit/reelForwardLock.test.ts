import { flushPromises } from '@vue/test-utils'
import { expect, it, vi } from 'vitest'
import { createInitialRuntimeState } from '@/core/initialRuntimeState'
import { ReelForwardController } from '@/core/reelForwardController'
import type { VibeItem } from '@/types'

const item: VibeItem = { postId: 1, src: 'data:,fixture', items: [] }
function fixture() {
  const state = createInitialRuntimeState({ target: document.createElement('div') }, 'masonry')
  state.next = 'next'
  state.reelOrigin = 'masonry'
  state.activeReelPostId = 1
  let resolve!: () => void
  const replenishAfterRemoval = vi.fn(() => new Promise<void>((done) => { resolve = done }))
  const onCloseReel = vi.fn()
  const onActivate = vi.fn()
  const controller = new ReelForwardController({ state, onCloseReel, onActivate, replenishAfterRemoval })
  controller.start({}, 0, item)
  return { state, controller, resolve, replenishAfterRemoval, onCloseReel, onActivate }
}

it('honors a lock engaged while forward loading was in flight', async () => {
  const { state, resolve, onCloseReel, replenishAfterRemoval } = fixture()
  state.loadMoreLocked = true
  state.next = 'later'
  resolve()
  await flushPromises()
  expect(onCloseReel).toHaveBeenCalledOnce()
  expect(replenishAfterRemoval).toHaveBeenCalledOnce()
  expect(state.reelForward).toEqual({ status: 'idle', error: null })
  expect(state.next).toBe('later')
})

it('accepts an already requested successor even if loading was locked meanwhile', async () => {
  const { state, resolve, onCloseReel, onActivate } = fixture()
  state.loadMoreLocked = true
  state.items = [{ ...item, postId: 2 }]
  resolve()
  await flushPromises()
  expect(onCloseReel).not.toHaveBeenCalled()
  expect(onActivate).toHaveBeenCalledWith(2)
  expect(state.reelForward.status).toBe('idle')
})

it('cannot resurrect an error or close the feed after forward loading is reset', async () => {
  const { state, controller, resolve, onCloseReel } = fixture()
  controller.reset()
  state.loadMoreLocked = true
  state.nextPageError = new Error('previous request')
  resolve()
  await flushPromises()
  expect(onCloseReel).not.toHaveBeenCalled()
  expect(state.reelForward).toEqual({ status: 'idle', error: null })
})
