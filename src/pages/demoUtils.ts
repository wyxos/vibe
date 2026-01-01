import { nextTick, onMounted, onUnmounted, type Ref } from 'vue'

import type { PageToken } from '@/masonry/types'

type WindowRecord = Window & Record<string, unknown>

export function useExposeDebugRef<T>(refToExpose: Ref<T | null>, globalKey = '__vibeMasonry') {
  onMounted(async () => {
    await nextTick()
    const w = window as unknown as WindowRecord
    w[globalKey] = refToExpose.value as unknown
  })

  onUnmounted(() => {
    const w = window as unknown as WindowRecord
    if (w[globalKey] === (refToExpose.value as unknown)) {
      w[globalKey] = null
    }
  })
}

export function setReaction<T extends { reaction: string | null }>(item: T, reaction: string) {
  if (!item) return
  if (item.reaction === reaction) return
  item.reaction = reaction
}

export function getQueryParamFromLocation(name: string): string | null {
  // Supports hash-mode urls like: /#/examples/backfill?page=2
  const hash = window.location.hash || ''
  const hashQuery = hash.includes('?') ? hash.split('?').slice(1).join('?') : ''
  const searchQuery = window.location.search?.startsWith('?')
    ? window.location.search.slice(1)
    : window.location.search

  const queryString = hashQuery || searchQuery || ''
  const raw = new URLSearchParams(queryString).get(name)
  const trimmed = raw?.trim() ?? ''
  return trimmed ? trimmed : null
}

export function getInitialPageToken(paramName = 'page', fallback: PageToken = 1): PageToken {
  return getQueryParamFromLocation(paramName) ?? fallback
}

export function buildPagesLoadedLabel<T extends { id?: string | null }>(
  items: readonly T[],
  getPageLabelFromId: (id: string | null | undefined) => string | null
): string {
  if (!Array.isArray(items) || items.length === 0) return '—'

  const pages = new Set<number>()
  for (let i = 0; i < items.length; i += 1) {
    const pageLabel = getPageLabelFromId(items[i]?.id)
    if (!pageLabel) continue
    const n = Number.parseInt(pageLabel, 10)
    if (Number.isFinite(n)) pages.add(n)
  }

  const sorted = Array.from(pages).sort((a, b) => a - b)
  return sorted.length ? sorted.join(', ') : '—'
}
