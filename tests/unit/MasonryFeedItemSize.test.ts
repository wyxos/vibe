import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import MasonryFeed from '@/components/MasonryFeed.vue'

function feedItem(
  postId: number,
  preview = { height: 600, width: 450 },
) {
  return {
    height: preview.height * 2,
    items: [],
    postId,
    preview: {
      ...preview,
      src: `https://example.com/${postId}-preview.jpg`,
    },
    src: `https://example.com/${postId}.jpg`,
    width: preview.width * 2,
  }
}

function props(items: ReturnType<typeof feedItem>[]) {
  return {
    canRetryEnd: false,
    enteringPostIds: new Set<number>(),
    entryDelays: new Map(),
    hasNext: false,
    infiniteScroll: true,
    isLoadingMore: false,
    items,
    loadMoreLocked: false,
    mediaIndices: new Map(),
    nextPageError: false,
    previewStates: new Map(),
    total: null,
  }
}

function cardBox(wrapper: ReturnType<typeof mount>, postId: number) {
  const style = (wrapper.get(`[data-post-id="${postId}"]`).element as HTMLElement).style
  return { height: style.height, width: style.width }
}

describe('MasonryFeed item size', () => {
  beforeEach(() => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(500)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(500)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('keeps remaining card sizes when a neighbor is removed', async () => {
    const items = [
      feedItem(1, { height: 400, width: 450 }),
      feedItem(2, { height: 800, width: 450 }),
      feedItem(3, { height: 600, width: 450 }),
    ]
    const wrapper = mount(MasonryFeed, { props: props(items) })
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    const before = {
      two: cardBox(wrapper, 2),
      three: cardBox(wrapper, 3),
    }

    const beforeTwo = (wrapper.get('[data-post-id="2"]').element as HTMLElement)
      .style.transform

    await wrapper.setProps({
      leavingPostIds: new Set([1]),
      removalDelays: new Map([[1, 0]]),
    })
    await wrapper.vm.$nextTick()
    expect(cardBox(wrapper, 2)).toEqual(before.two)
    expect(cardBox(wrapper, 3)).toEqual(before.three)
    expect((wrapper.get('[data-post-id="2"]').element as HTMLElement).style.transform)
      .not.toBe(beforeTwo)

    await wrapper.setProps({
      items: items.slice(1),
      leavingPostIds: new Set(),
      removalDelays: new Map(),
    })
    await wrapper.vm.$nextTick()
    expect(cardBox(wrapper, 2)).toEqual(before.two)
    expect(cardBox(wrapper, 3)).toEqual(before.three)
  })

  it('updates size only when the post preview dimensions change', async () => {
    const wrapper = mount(MasonryFeed, {
      props: props([feedItem(4, { height: 600, width: 450 })]),
    })
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    const before = cardBox(wrapper, 4)

    await wrapper.setProps({
      items: [feedItem(4, { height: 300, width: 450 })],
    })
    await wrapper.vm.$nextTick()
    const after = cardBox(wrapper, 4)

    expect(after.width).toBe(before.width)
    expect(after.height).not.toBe(before.height)
  })

  it('closes holes after a neighbor is removed without changing remaining sizes', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1_400)
    const chrome = { template: '<div />' }
    const items = Array.from({ length: 24 }, (_, index) => feedItem(
      index + 1,
      { height: 400 + ((index % 3) * 120), width: 450 },
    ))
    const wrapper = mount(MasonryFeed, {
      props: {
        ...props(items),
        cardFooter: { component: chrome, height: 40 },
        cardHeader: { component: chrome, height: 30 },
        masonry: { minColumnWidth: 320 },
      },
    })
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    const mountedIds = wrapper.findAll('.masonry-item')
      .map((card) => Number(card.attributes('data-post-id')))
      .filter((postId) => postId !== 1)
    const before = Object.fromEntries(mountedIds.map((postId) => [
      postId,
      cardBox(wrapper, postId),
    ]))

    await wrapper.setProps({
      leavingPostIds: new Set([1]),
      removalDelays: new Map([[1, 0]]),
    })
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expectPackedColumns(wrapper, new Set([1]), 10.5)
    expect(wrapper.findAll('.masonry-item').length).toBeGreaterThan(8)
    mountedIds.forEach((postId) => {
      if (wrapper.find(`[data-post-id="${postId}"]`).exists()) {
        expect(cardBox(wrapper, postId)).toEqual(before[postId])
      }
    })

    await wrapper.setProps({
      items: items.slice(1),
      leavingPostIds: new Set(),
      removalDelays: new Map(),
    })
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expectPackedColumns(wrapper, new Set(), 10.5)
    mountedIds.forEach((postId) => {
      if (wrapper.find(`[data-post-id="${postId}"]`).exists()) {
        expect(cardBox(wrapper, postId)).toEqual(before[postId])
      }
    })
  })
})

function cardPlacement(wrapper: ReturnType<typeof mount>, postId: number) {
  const style = (wrapper.get(`[data-post-id="${postId}"]`).element as HTMLElement).style
  const match = style.transform.match(/translate3d\(([-\d.]+)px, ([-\d.]+)px,/)
  return {
    height: Number.parseFloat(style.height),
    width: Number.parseFloat(style.width),
    x: Number.parseFloat(match?.[1] ?? 'NaN'),
    y: Number.parseFloat(match?.[2] ?? 'NaN'),
  }
}

function expectPackedColumns(
  wrapper: ReturnType<typeof mount>,
  leavingPostIds: ReadonlySet<number>,
  gap = 6,
): void {
  const cards = wrapper.findAll('.masonry-item').flatMap((card) => {
    const postId = Number(card.attributes('data-post-id'))
    if (leavingPostIds.has(postId)) return []
    return [cardPlacement(wrapper, postId)]
  })
  expect(cards.length).toBeGreaterThan(0)

  const columns = new Map<number, typeof cards>()
  cards.forEach((card) => {
    const column = columns.get(card.x) ?? []
    column.push(card)
    columns.set(card.x, column)
  })

  columns.forEach((column) => {
    column.sort((left, right) => left.y - right.y)
    column.slice(1).forEach((card, index) => {
      const previous = column[index]!
      expect(card.y).toBeCloseTo(previous.y + previous.height + gap, 0)
    })
  })
}
