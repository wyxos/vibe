import { describe, expect, it } from 'vitest'

import { createTrackedFakeFeedResolver } from '@/demo/fakeFeedResolver'

describe('fakeFeedResolver', () => {
  it('returns underfilled dynamic pages that require Vibe to fill across cursors', async () => {
    const resolver = createTrackedFakeFeedResolver({
      initialCursor: 1,
      mode: 'dynamic',
    })

    const pageOne = await resolver.resolve({
      cursor: '1',
      pageSize: 25,
    })
    const pageTwo = await resolver.resolve({
      cursor: '2',
      pageSize: 25,
    })
    const pageThree = await resolver.resolve({
      cursor: '3',
      pageSize: 25,
    })
    const pageFour = await resolver.resolve({
      cursor: '4',
      pageSize: 25,
    })

    expect(pageOne.items).toHaveLength(25)
    expect(pageOne.nextPage).toBe('2')
    expect(pageTwo.items).toHaveLength(8)
    expect(pageThree.items).toHaveLength(7)
    expect(pageFour.items).toHaveLength(10)
    expect(pageTwo.items.length + pageThree.items.length + pageFour.items.length).toBe(25)
    expect(resolver.status.firstLoadedCursor).toBe('1')
    expect(resolver.status.lastLoadedCursor).toBe('4')
  })

  it('reloads a static page from the same cursor after demo-side removals and restores order on undo', async () => {
    const resolver = createTrackedFakeFeedResolver({
      initialCursor: 10,
      mode: 'static',
    })

    const beforeRemoval = await resolver.resolve({
      cursor: '10',
      pageSize: 25,
    })
    const removedId = beforeRemoval.items[0]?.id
    const nextId = beforeRemoval.items[1]?.id
    const shiftedId = beforeRemoval.items[24]?.id

    expect(removedId).toBeTruthy()
    expect(nextId).toBeTruthy()
    expect(shiftedId).toBeTruthy()

    resolver.remove([removedId!])

    const afterRemoval = await resolver.resolve({
      cursor: '10',
      pageSize: 25,
    })

    expect(afterRemoval.items).toHaveLength(25)
    expect(afterRemoval.items[0]?.id).toBe(nextId)
    expect(afterRemoval.items.some((item) => item.id === removedId)).toBe(false)
    expect(afterRemoval.items[23]?.id).toBe(shiftedId)

    const undoResult = resolver.undo()
    expect(undoResult?.ids).toEqual([removedId])

    const afterUndo = await resolver.resolve({
      cursor: '10',
      pageSize: 25,
    })

    expect(afterUndo.items).toHaveLength(25)
    expect(afterUndo.items[0]?.id).toBe(removedId)
    expect(afterUndo.items[1]?.id).toBe(nextId)
  })
})
