import { describe, expect, it, vi } from 'vitest'

import {
  createFakeMediaServer,
  type FakeMediaFetch,
} from '@/demo/fakeServer'

interface TestFixtureItem {
  url: string
  postId?: number
  width: number | null
  height: number | null
}

function fixtureItem(
  postId: number,
  name: string,
  width: number | null = 900,
  height: number | null = 1200,
): TestFixtureItem {
  return {
    url: `https://image.civitai.com/example/original=true/${name}.jpeg`,
    postId,
    width,
    height,
  }
}

function response(value: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => value,
  }
}

function fixtureFetcher(overrides = new Map<number, TestFixtureItem[]>()) {
  return vi.fn<FakeMediaFetch>(async (url) => {
    const match = url.match(/page-(\d+)\.json$/)
    if (!match) throw new Error(`Unexpected fixture URL: ${url}`)

    const page = Number(match[1])

    return response({
      items: overrides.get(page) ?? [fixtureItem(page, `image-${page}`)],
      metadata: {
        nextCursor: page < 10 ? `cursor-${page + 1}` : null,
      },
    })
  })
}

describe('fake media server', () => {
  it.each([undefined, null, 1, '1'])('loads page one for %s', async (cursor) => {
    const fetcher = fixtureFetcher()
    const getMediaPage = createFakeMediaServer(fetcher)

    const page = await getMediaPage(cursor)

    expect(fetcher).toHaveBeenCalledWith('/data/civitai/images/page-01.json')
    expect(page).toEqual({
      items: [{
        postId: 1,
        items: [{
          src: 'https://image.civitai.com/example/original=true/image-1.jpeg',
          preview: {
            src: 'https://image.civitai.com/example/width=450/image-1.jpeg',
            width: 450,
            height: 600,
          },
          width: 900,
          height: 1200,
        }],
      }],
      meta: {
        next: 'cursor-2',
        total: 1000,
      },
    })
  })

  it('uses the returned cursor to load the following page', async () => {
    const fetcher = fixtureFetcher()
    const getMediaPage = createFakeMediaServer(fetcher)

    const firstPage = await getMediaPage(null)
    const secondPage = await getMediaPage(firstPage.meta.next)

    expect(secondPage.items[0]?.postId).toBe(2)
    expect(secondPage.meta.next).toBe('cursor-3')
  })

  it('keeps a post together when its items cross fixture pages', async () => {
    const fetcher = fixtureFetcher(new Map([
      [1, [fixtureItem(99, 'first')]],
      [2, [fixtureItem(99, 'second')]],
    ]))
    const getMediaPage = createFakeMediaServer(fetcher)

    const firstPage = await getMediaPage(1)
    const secondPage = await getMediaPage(firstPage.meta.next)

    expect(firstPage.items).toHaveLength(1)
    expect(firstPage.items[0]?.postId).toBe(99)
    expect(firstPage.items[0]?.items).toHaveLength(2)
    expect(secondPage.items).toHaveLength(0)
  })

  it('ends pagination at the final fixture and preserves missing dimensions', async () => {
    const fetcher = fixtureFetcher(new Map([
      [10, [fixtureItem(10, 'image-10', null, null)]],
    ]))
    const getMediaPage = createFakeMediaServer(fetcher)

    const page = await getMediaPage(10)
    const item = page.items[0]?.items[0]

    expect(item).toMatchObject({
      width: null,
      height: null,
      preview: { width: null, height: null },
    })
    expect(page.meta.next).toBeNull()
  })

  it('rejects fixture items without a post ID', async () => {
    const fetcher = fixtureFetcher(new Map([
      [1, [{
        url: 'https://image.civitai.com/example/original=true/missing-post.jpeg',
        width: 900,
        height: 1200,
      }]],
    ]))
    const getMediaPage = createFakeMediaServer(fetcher)

    await expect(getMediaPage(1)).rejects.toThrow('without a postId')
  })
})
