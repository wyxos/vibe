import { loadFillDemoPage } from './fillPage'
import type {
  VibeBackendFillCancelContext,
  VibeBackendFillSession,
  VibeBackendFillStartContext,
  VibeBackendFillUpdate,
  VibeCursor,
  VibeFillTarget,
  VibeItem,
} from '@/types'

interface BackendFillJob {
  completedPages: number
  cycleId: string
  feedKey: string
  items: VibeItem[]
  lastCursor: VibeCursor
  next: VibeCursor
  received: number
  sequence: number
  sessionId: string
  target: VibeFillTarget
  total: number | null
}

type UpdateListener = (update: VibeBackendFillUpdate) => void

function appendUnique(current: readonly VibeItem[], incoming: readonly VibeItem[]): VibeItem[] {
  const ids = new Set(current.map((item) => item.postId))
  return [
    ...current,
    ...incoming.filter((item) => {
      if (ids.has(item.postId)) return false
      ids.add(item.postId)
      return true
    }),
  ]
}

function terminalStatus(job: BackendFillJob): 'complete' | 'exhausted' | null {
  if ('pages' in job.target && job.completedPages >= job.target.pages) {
    return 'complete'
  }
  if (job.next !== null) return null
  return 'pages' in job.target ? 'exhausted' : 'complete'
}

export class BackendFillSimulator {
  private controller: AbortController | null = null
  private job: BackendFillJob | null = null
  private listeners = new Set<UpdateListener>()
  private timer: ReturnType<typeof setTimeout> | null = null

  start(context: VibeBackendFillStartContext): VibeBackendFillSession {
    this.reset()
    this.job = {
      completedPages: 0,
      cycleId: context.cycleId,
      feedKey: context.feedKey,
      items: [],
      lastCursor: context.next,
      next: context.next,
      received: 0,
      sequence: 0,
      sessionId: `demo-${context.cycleId}`,
      target: context.target,
      total: context.total,
    }
    this.schedule()
    return { sessionId: this.job.sessionId }
  }

  cancel(context: VibeBackendFillCancelContext): void {
    const job = this.job
    if (!job || job.cycleId !== context.cycleId) return
    if (context.sessionId && context.sessionId !== job.sessionId) return
    this.controller?.abort()
    this.clearTimer()
    job.sequence += 1
    this.emit({
      completedPages: job.completedPages,
      feedKey: job.feedKey,
      received: job.received,
      sequence: job.sequence,
      sessionId: job.sessionId,
      status: 'cancelled',
    })
  }

  reset(): void {
    this.controller?.abort()
    this.controller = null
    this.clearTimer()
    this.job = null
  }

  destroy(): void {
    this.reset()
    this.listeners.clear()
  }

  subscribe(listener: UpdateListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private schedule(): void {
    this.timer = setTimeout(() => { void this.processNextPage() }, 250)
  }

  private clearTimer(): void {
    if (this.timer !== null) clearTimeout(this.timer)
    this.timer = null
  }

  private async processNextPage(): Promise<void> {
    const job = this.job
    if (!job || job.next === null) return
    const controller = new AbortController()
    this.controller = controller
    const cursor = job.next

    try {
      const page = await loadFillDemoPage({ cursor, signal: controller.signal })
      if (controller.signal.aborted || this.job !== job) return
      job.completedPages += 1
      job.lastCursor = cursor
      job.items = appendUnique(job.items, page.items)
      job.next = page.next
      job.received = job.items.length
      job.sequence += 1
      if (page.total !== undefined) job.total = page.total

      const status = terminalStatus(job)
      if (status) {
        this.emit({
          completedPages: job.completedPages,
          feedKey: job.feedKey,
          items: job.items,
          lastCursor: job.lastCursor,
          next: job.next,
          received: job.received,
          sequence: job.sequence,
          sessionId: job.sessionId,
          status,
          total: job.total ?? undefined,
        })
        return
      }

      this.emit({
        completedPages: job.completedPages,
        feedKey: job.feedKey,
        received: job.received,
        sequence: job.sequence,
        sessionId: job.sessionId,
        status: 'waiting',
        total: job.total ?? undefined,
      })
      this.schedule()
    } catch (error: unknown) {
      if (controller.signal.aborted || this.job !== job) return
      job.sequence += 1
      this.emit({
        completedPages: job.completedPages,
        error,
        feedKey: job.feedKey,
        received: job.received,
        sequence: job.sequence,
        sessionId: job.sessionId,
        status: 'error',
      })
    } finally {
      if (this.controller === controller) this.controller = null
    }
  }

  private emit(update: VibeBackendFillUpdate): void {
    this.listeners.forEach((listener) => listener(update))
  }
}
