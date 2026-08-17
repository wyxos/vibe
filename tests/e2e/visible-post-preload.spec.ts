import { expect, test } from '@playwright/test'

interface FixtureItem {
  postId: number
  url: string
}

const transparentPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64',
)

function previewUrl(src: string): string {
  return src.replace('/original=true/', '/width=450/')
}

test('visible grouped cards warm every child preview but overscan cards do not', async ({
  page,
}) => {
  const requested = new Set<string>()
  page.on('request', (request) => requested.add(request.url()))
  await page.route('https://image.civitai.com/**', async (route) => {
    await route.fulfill({ body: transparentPng, contentType: 'image/png' })
  })
  const fixtureResponse = await page.request.get('/data/civitai/images/page-01.json')
  const fixture = await fixtureResponse.json() as { items: FixtureItem[] }
  const byPost = new Map<number, FixtureItem[]>()
  fixture.items.forEach((item) => {
    const values = byPost.get(item.postId) ?? []
    values.push(item)
    byPost.set(item.postId, values)
  })

  await page.goto('/demos/item-removal')
  await expect(page.locator('.masonry-item').first()).toBeVisible()
  const mounted = await page.locator('.masonry-item').evaluateAll((cards) => cards.map((card) => {
    const rect = card.getBoundingClientRect()
    return {
      inViewport: rect.bottom > 0 && rect.top < window.innerHeight,
      postId: Number((card as HTMLElement).dataset.postId),
    }
  }))
  const visiblePost = mounted.find(({ inViewport, postId }) => (
    inViewport && (byPost.get(postId)?.length ?? 0) > 1
  ))
  const overscanPost = mounted.find(({ inViewport, postId }) => (
    !inViewport && (byPost.get(postId)?.length ?? 0) > 1
  ))
  expect(visiblePost).toBeDefined()
  expect(overscanPost).toBeDefined()

  const visibleChildren = byPost.get(visiblePost!.postId)!.slice(1)
    .map(({ url }) => previewUrl(url))
  await expect.poll(() => visibleChildren.every((url) => requested.has(url)))
    .toBe(true)

  const overscanChildren = byPost.get(overscanPost!.postId)!.slice(1)
    .map(({ url }) => previewUrl(url))
  await page.waitForTimeout(300)
  expect(overscanChildren.some((url) => requested.has(url))).toBe(false)

  const card = page.locator(`.masonry-item[data-post-id="${visiblePost!.postId}"]`)
  await card.locator('.media-carousel-control--next').click({ force: true })
  await expect.poll(() => card.locator('img').evaluate((image) => ({
    complete: image.complete,
    width: image.naturalWidth,
  }))).toEqual({ complete: true, width: 1 })
})
