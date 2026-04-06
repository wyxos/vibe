import { describe, expect, it } from 'vitest'

import { createFakeMediaServer, type FakeMediaItem } from '@/demo/fakeServer'

describe('createFakeMediaServer', () => {
  it('builds a 25-item page across 100 default pages and preserves the simplified media contract', async () => {
    const server = createFakeMediaServer({
      maxDelayMs: 0,
      minDelayMs: 0,
    })

    const response = await server.fetchPage()
    const audioItem = server.list().find((item) => item.type === 'audio')
    const visualItem = server.list().find((item) =>
      (item.type === 'image' || item.type === 'video')
      && item.preview
      && (item.width !== item.preview.width || item.height !== item.preview.height),
    )

    expect(response).toMatchObject({
      page: 1,
      pageSize: 25,
      totalItems: 2_500,
      totalPages: 100,
      nextPage: '2',
      previousPage: null,
    })
    expect(response.items).toHaveLength(25)
    expect(audioItem?.preview?.url).toBe(audioItem?.url)
    expect(visualItem?.width).toBeDefined()
    expect(visualItem?.height).toBeDefined()
    expect(visualItem?.preview?.width).toBeDefined()
    expect(visualItem?.preview?.height).toBeDefined()
    expect(visualItem?.width).not.toBe(visualItem?.preview?.width)
    expect(visualItem?.height).not.toBe(visualItem?.preview?.height)
  })

  it('uses the default paging values and returns the expected response shape', async () => {
    const server = createFakeMediaServer({
      items: createItems(60),
      maxDelayMs: 0,
      minDelayMs: 0,
    })

    const response = await server.fetchPage()

    expect(response).toMatchObject({
      page: 1,
      pageSize: 25,
      totalItems: 60,
      totalPages: 3,
      nextPage: '2',
      previousPage: null,
    })
    expect(response.items).toHaveLength(25)
    expect(response.items[0]?.id).toBe('item-1')
    expect(typeof response.latencyMs).toBe('number')
  })

  it('normalizes invalid page input and falls back to the configured default page size', async () => {
    const server = createFakeMediaServer({
      defaultPageSize: 4,
      items: createItems(15),
      maxDelayMs: 0,
      minDelayMs: 0,
    })

    const response = await server.fetchPage({
      page: 'not-a-page',
      pageSize: 0,
    })

    expect(response.page).toBe(1)
    expect(response.pageSize).toBe(4)
    expect(response.items.map((item) => item.id)).toEqual(['item-1', 'item-2', 'item-3', 'item-4'])
    expect(response.nextPage).toBe('2')
    expect(response.previousPage).toBeNull()
  })

  it('returns a null next page on the final slice', async () => {
    const server = createFakeMediaServer({
      items: createItems(7),
      maxDelayMs: 0,
      minDelayMs: 0,
    })

    const response = await server.fetchPage({
      page: 4,
      pageSize: 2,
    })

    expect(response.items.map((item) => item.id)).toEqual(['item-7'])
    expect(response.totalPages).toBe(4)
    expect(response.nextPage).toBeNull()
    expect(response.previousPage).toBe('3')
  })
})

function createItems(count: number): FakeMediaItem[] {
  return Array.from({ length: count }, (_, index) => createItem(index + 1))
}

function createItem(index: number): FakeMediaItem {
  return {
    id: `item-${index}`,
    type: 'image',
    title: `Item ${index}`,
    url: `https://example.com/item-${index}.jpg`,
    width: 1_920,
    height: 1_080,
    preview: {
      url: `https://example.com/item-${index}-preview.jpg`,
      width: 320,
      height: 180,
    },
  }
}
