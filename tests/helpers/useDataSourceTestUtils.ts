import type { VibeResolveResult } from '@/components/viewer-core/useDataSource'
import type { VibeViewerItem } from '@/components/viewer'

export function createPageResult(
  pageLabel: string,
  options: {
    itemCount?: number
    nextPage?: string | null
    previousPage?: string | null
  } = {},
): VibeResolveResult {
  return {
    items: createItems(pageLabel, options.itemCount ?? 25),
    nextPage: options.nextPage ?? null,
    previousPage: options.previousPage,
  }
}

export function createItems(prefix: string, count = 25): VibeViewerItem[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `${prefix}-item-${index + 1}`,
    type: index % 5 === 0 ? 'video' : 'image',
    title: `${prefix} item ${index + 1}`,
    url: `https://example.com/${prefix}-item-${index + 1}.jpg`,
    width: 1_920,
    height: 1_080,
    preview: {
      url: `https://example.com/${prefix}-item-${index + 1}-preview.jpg`,
      width: 320,
      height: 180,
    },
  }))
}

export function createSimpleItem(id: string): VibeViewerItem {
  return {
    id,
    type: 'image',
    title: `Item ${id}`,
    url: `https://example.com/${id}.jpg`,
    width: 1_920,
    height: 1_080,
    preview: {
      url: `https://example.com/${id}-preview.jpg`,
      width: 320,
      height: 180,
    },
  }
}

export function getVisibleIds(items: VibeViewerItem[]) {
  return items.map((item) => item.id)
}

export function createDeferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void

  const promise = new Promise<T>((innerResolve, innerReject) => {
    resolve = innerResolve
    reject = innerReject
  })

  return {
    promise,
    reject,
    resolve,
  }
}
