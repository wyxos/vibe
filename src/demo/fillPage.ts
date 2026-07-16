import { getFakeMediaPage } from './fakeServer'
import type { VibePage, VibePageRequest } from '@/types'

export const FILL_DEMO_DEFAULT_PAGES = 3

export async function loadFillDemoPage({
  cursor,
  signal,
}: VibePageRequest): Promise<VibePage> {
  const page = await getFakeMediaPage(cursor)
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError')

  return {
    items: page.items,
    next: page.meta.next,
    total: page.meta.total,
  }
}
