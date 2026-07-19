import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createVibe, type VibeInstance, type VibeItem } from '@/index'

function item(postId: number, previewSrc = `https://example.com/${postId}-preview.jpg`): VibeItem {
  return {
    postId,
    src: `https://example.com/${postId}.jpg`,
    preview: { src: previewSrc, width: 450, height: 600 },
    width: 900,
    height: 1200,
    items: [],
  }
}

describe('rewrite regressions', () => {
  const instances: VibeInstance[] = []
  let target: HTMLDivElement

  beforeEach(() => {
    target = document.createElement('div')
    document.body.append(target)
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      callback(0)
      return 1
    }))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(500)
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(500)
  })

  afterEach(() => {
    instances.splice(0).forEach((instance) => instance.destroy())
    target.remove()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  function track(instance: VibeInstance): VibeInstance {
    instances.push(instance)
    return instance
  }

  it('removes stale posts when a reload replaces the feed', async () => {
    const loadPage = vi.fn()
      .mockResolvedValueOnce({ items: [item(1), item(2)], next: null, total: 2 })
      .mockResolvedValueOnce({ items: [item(2), item(3)], next: null, total: 2 })
    const vibe = track(createVibe({ loadPage, target }))

    await vibe.mount()
    expect(target.querySelector('[data-post-id="1"]')).not.toBeNull()

    await vibe.reload()
    await flushPromises()

    expect(vibe.getState().items.map(({ postId }) => postId)).toEqual([2, 3])
    expect(target.querySelector('[data-post-id="1"]')).toBeNull()
    expect(target.querySelectorAll('[data-post-id="2"]')).toHaveLength(1)
    expect(target.querySelector('[data-post-id="3"]')).not.toBeNull()
  })

  it('keeps a failed asset in the feed and renders its status fallback', async () => {
    const failedSrc = 'https://example.com/demo-errors/403/blocked.jpg'
    const vibe = track(createVibe({
      target,
      initialPage: { items: [item(1, failedSrc), item(2)], next: null },
    }))

    await vibe.mount()
    const failedImage = target.querySelector<HTMLImageElement>('[data-post-id="1"] img')!
    failedImage.dispatchEvent(new Event('error'))
    await flushPromises()

    const fallback = target.querySelector<HTMLElement>('[data-post-id="1"] [data-test="media-error"]')
    expect(fallback?.getAttribute('aria-label')).toBe('403 Access forbidden')
    expect(fallback?.textContent).toContain('Access forbidden')
    expect(vibe.getState().items.map(({ postId }) => postId)).toEqual([1, 2])
    expect(target.querySelector('[data-post-id="2"]')).not.toBeNull()
  })

  it('preserves loaded posts across an exhausted-page failure and retries the cursor', async () => {
    const loadPage = vi.fn()
      .mockResolvedValueOnce({ items: [item(1)], next: 'page-2', total: 2 })
      .mockRejectedValueOnce(new Error('temporary outage'))
      .mockResolvedValueOnce({ items: [item(2)], next: null, total: 2 })
    const vibe = track(createVibe({ loadPage, target }))

    await vibe.mount()
    await vibe.loadNext()
    await flushPromises()

    expect(vibe.getState().items.map(({ postId }) => postId)).toEqual([1])
    expect(vibe.getState().next).toBe('page-2')
    expect(vibe.getState().nextPageError).toBeInstanceOf(Error)
    expect(target.textContent).toContain('Try again')

    await vibe.loadNext()
    await flushPromises()

    expect(loadPage.mock.calls.slice(1).map(([request]) => request.cursor))
      .toEqual(['page-2', 'page-2'])
    expect(vibe.getState()).toMatchObject({ next: null, nextPageError: null })
    expect(vibe.getState().items.map(({ postId }) => postId)).toEqual([1, 2])
    expect(target.textContent).toContain("You've reached the end.")
  })
})
