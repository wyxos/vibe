import type { CreateVibeOptions, VibeItemId, VibeReorderPosition } from '../../src/index'
import { items } from './media'

interface SelectionHarness {
  batchCalls: VibeItemId[][]
  reorderCalls: { movedPostIds: VibeItemId[]; targetPostId: VibeItemId; position: VibeReorderPosition }[]
  failBatch: boolean
  failReorder: boolean
  holdBatch: boolean
  holdReorder: boolean
  resolveOperation?: () => void
  operationAborted: boolean
  reorderResult?: boolean
  dragEvents: string[]
}

declare global {
  interface Window { __selectionHarness: SelectionHarness }
}

/** Independent fixture using the same public source/built entrypoint as the other browser tests. */
export function selectionHarness(params: URLSearchParams): Partial<CreateVibeOptions> {
  const harness: SelectionHarness = {
    batchCalls: [], reorderCalls: [], failBatch: false, failReorder: false,
    holdBatch: false, holdReorder: false, operationAborted: false,
    dragEvents: [],
  }
  window.__selectionHarness = harness
  const waitForOperation = (signal: AbortSignal) => new Promise<void>((resolve) => {
    harness.resolveOperation = resolve
    signal.addEventListener('abort', () => {
      harness.operationAborted = true
      resolve()
    }, { once: true })
  })
  return {
    layout: 'masonry',
    initialPage: { items: items(1, 40), next: 41, total: 160 },
    selection: params.has('disabled') || params.has('orderingOnly') ? false : {
      ...(params.has('implicitSelection') ? {
        activation: 'card-chrome' as const, checkboxVisibility: 'selection' as const,
        toolbar: params.has('hideSelectionToolbar') ? 'hidden' as const : 'selection' as const,
      } : {}),
      getLabel: (item) => `Item ${item.postId}`,
      actions: [{
        id: 'collect', label: 'Collect selected',
        run: async (ids, { signal }) => {
          harness.batchCalls.push([...ids])
          if (harness.holdBatch) await waitForOperation(signal)
          if (harness.failBatch) throw new Error('Synthetic batch rejection')
        },
      }],
    },
    ordering: params.has('disabled') || params.has('implicitSelection') ? undefined : {
      onReorder: async ({ movedPostIds, targetPostId, position, signal }) => {
        harness.reorderCalls.push({ movedPostIds: [...movedPostIds], targetPostId, position })
        if (harness.holdReorder) await waitForOperation(signal)
        if (harness.failReorder) throw new Error('Synthetic order rejection')
      },
    },
    loadPage: async ({ cursor }) => {
      window.__requests++
      const first = typeof cursor === 'number' ? cursor : 1
      return { items: items(first, 40), next: first < 121 ? first + 40 : null, total: 160 }
    },
  }
}
