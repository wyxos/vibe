import { getFakeMediaPage } from './fakeServer'
import type { VibePage, VibePageRequest } from '@/types'

export const AUTOFILL_DEMO_TARGET_SIZE = 60

export async function loadAutofillDemoPage({
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
