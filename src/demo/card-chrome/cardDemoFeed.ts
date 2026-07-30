import { getFakeMediaPage } from '@/demo/fakeServer'
import type {
  VibePage,
  VibePageRequest,
} from '@/index'

let failNextRequest = false

export function failNextCardDemoRequest(): void {
  failNextRequest = true
}

export function resetCardDemoFeed(): void {
  failNextRequest = false
}

export async function loadCardDemoPage({
  cursor,
  signal,
}: VibePageRequest): Promise<VibePage> {
  if (failNextRequest) {
    failNextRequest = false
    throw new Error('Simulated grouped-feed provider failure.')
  }

  const page = await getFakeMediaPage(cursor)
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError')

  // This demo provider groups raw fixture media by postId before Vibe sees it.
  // Vibe receives one top-level item per post and only deduplicates across pages.
  const postIds = new Set(page.items.map((item) => item.postId))
  if (postIds.size !== page.items.length) {
    throw new Error('The card demo provider must return one grouped VibeItem per post.')
  }

  return {
    items: page.items,
    next: page.meta.next,
    total: page.meta.total,
  }
}
