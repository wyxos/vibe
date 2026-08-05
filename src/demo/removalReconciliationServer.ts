import type {
  VibeCursor,
  VibeItem,
  VibePage,
  VibePageRequest,
} from '@/types'

export const RECONCILIATION_DEMO_PAGE_SIZE = 20
export const RECONCILIATION_DEMO_PAGE_CURSORS = [null, 'p2', 'p3'] as const
export const RECONCILIATION_DEMO_REMOVALS = [2, 7, 11, 23, 31, 43, 44, 51, 55] as const

const NEXT_PAGE_BY_CURSOR = new Map<VibeCursor, VibeCursor>([
  [null, 'p2'],
  ['p2', 'p3'],
  ['p3', 'p4'],
  ['p4', 'p5'],
  ['p5', null],
])

export type ReconciliationDemoScenario = 'full' | 'variation'
export type ReconciliationDemoDataset = 'baseline' | 'published'
export type ReconciliationDemoRequestPhase = 'direct' | 'initial' | 'reconcile'
export type ReconciliationDemoRequestStatus = 'failed' | 'pending' | 'succeeded'

export interface ReconciliationDemoRequest {
  batch: number
  cursor: VibeCursor
  dataset: ReconciliationDemoDataset
  id: number
  itemIds: number[]
  next: VibeCursor
  phase: ReconciliationDemoRequestPhase
  scenario: ReconciliationDemoScenario
  status: ReconciliationDemoRequestStatus
}

type RequestListener = (requests: readonly ReconciliationDemoRequest[]) => void

function ids(from: number, count: number): number[] {
  return Array.from({ length: count }, (_, index) => from + index)
}

function baselinePages(scenario: ReconciliationDemoScenario): Map<VibeCursor, number[]> {
  if (scenario === 'full') {
    return new Map([
      [null, ids(1, 20)],
      ['p2', ids(21, 20)],
      ['p3', ids(41, 20)],
      ['p4', ids(61, 20)],
      ['p5', ids(81, 20)],
    ])
  }

  return new Map([
    [null, ids(1, 20)],
    ['p2', ids(21, 18)],
    ['p3', ids(39, 20)],
    ['p4', ids(59, 20)],
    ['p5', ids(79, 20)],
  ])
}

function publishedPages(): Map<VibeCursor, number[]> {
  return new Map([
    [null, [...ids(1, 15).filter((id) => !RECONCILIATION_DEMO_REMOVALS.includes(id as never)), 101, 102, 103, 104, 105, 106, 107, 108]],
    ['p2', [...ids(21, 16).filter((id) => !RECONCILIATION_DEMO_REMOVALS.includes(id as never)), 109, 110, 111, 112, 113, 114]],
    ['p3', [...ids(39, 18).filter((id) => !RECONCILIATION_DEMO_REMOVALS.includes(id as never)), 115, 116, 117, 118, 119, 120]],
    ['p4', ids(59, 20)],
    ['p5', ids(79, 20)],
  ])
}

function mediaDataUrl(id: number): string {
  const replacement = id >= 101
  const background = replacement ? '#1d4ed8' : '#262626'
  const eyebrow = replacement ? 'NEW RESULT' : 'PROVIDER ITEM'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480"><rect width="640" height="480" fill="${background}"/><path d="M0 390L190 218l116 106 90-82 244 238H0Z" fill="#ffffff" fill-opacity=".12"/><text x="36" y="58" fill="#ffffff" fill-opacity=".7" font-family="system-ui,sans-serif" font-size="18" font-weight="700">${eyebrow}</text><text x="36" y="136" fill="#ffffff" font-family="system-ui,sans-serif" font-size="72" font-weight="750">${id}</text></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

function mediaItem(postId: number): VibeItem {
  const src = mediaDataUrl(postId)
  return {
    postId,
    src,
    preview: { src, width: 640, height: 480 },
    width: 640,
    height: 480,
    items: [],
  }
}

function abortError(): DOMException {
  return new DOMException('The request was aborted.', 'AbortError')
}

function wait(milliseconds: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(abortError())
      return
    }
    const timeout = window.setTimeout(() => {
      signal.removeEventListener('abort', handleAbort)
      resolve()
    }, milliseconds)
    function handleAbort(): void {
      window.clearTimeout(timeout)
      reject(abortError())
    }
    signal.addEventListener('abort', handleAbort, { once: true })
  })
}

export function createRemovalReconciliationDemoServer(responseDelayMs = 120) {
  const listeners = new Set<RequestListener>()
  const requests: ReconciliationDemoRequest[] = []
  let batch = 0
  let dataset: ReconciliationDemoDataset = 'baseline'
  let failNext = false
  let phase: ReconciliationDemoRequestPhase = 'initial'
  let scenario: ReconciliationDemoScenario = 'variation'

  function currentPages(): Map<VibeCursor, number[]> {
    return dataset === 'published' ? publishedPages() : baselinePages(scenario)
  }

  function emit(): void {
    listeners.forEach((listener) => listener(requests.map((request) => ({ ...request }))))
  }

  async function loadPage(request: VibePageRequest): Promise<VibePage> {
    const itemIds = currentPages().get(request.cursor)
    if (!itemIds) throw new RangeError(`Unknown reconciliation demo cursor: ${String(request.cursor)}`)
    const record: ReconciliationDemoRequest = {
      batch,
      cursor: request.cursor,
      dataset,
      id: requests.length + 1,
      itemIds: [],
      next: NEXT_PAGE_BY_CURSOR.get(request.cursor) ?? null,
      phase,
      scenario,
      status: 'pending',
    }
    requests.push(record)
    emit()
    await wait(responseDelayMs, request.signal)

    if (failNext) {
      failNext = false
      record.status = 'failed'
      emit()
      throw new Error(`Simulated provider failure at cursor ${String(record.cursor)}`)
    }

    record.itemIds = [...itemIds]
    record.status = 'succeeded'
    emit()
    return {
      items: itemIds.map(mediaItem),
      next: record.next,
      total: 100,
    }
  }

  return {
    beginBatch(nextPhase: ReconciliationDemoRequestPhase): number {
      batch += 1
      phase = nextPhase
      return batch
    },
    failNextRequest: () => { failNext = true },
    getCurrentPageIds: (cursor: VibeCursor) => [...(currentPages().get(cursor) ?? [])],
    getDataset: () => dataset,
    getInitialPageIds: (cursor: VibeCursor) => [...(baselinePages(scenario).get(cursor) ?? [])],
    getRequests: () => requests.map((request) => ({ ...request })),
    getScenario: () => scenario,
    loadPage,
    publishResults: () => { dataset = 'published' },
    reset(nextScenario: ReconciliationDemoScenario): void {
      batch = 0
      dataset = 'baseline'
      failNext = false
      phase = 'initial'
      requests.splice(0)
      scenario = nextScenario
      emit()
    },
    subscribe(listener: RequestListener): () => void {
      listeners.add(listener)
      listener(requests)
      return () => listeners.delete(listener)
    },
  }
}
