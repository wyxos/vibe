import { loadAutofillDemoPage } from './autofillPage'
import { getRequestDelayMs } from '@/core/requestDelay'
import type {
  VibeAutofillSessionSnapshot,
  VibeBackendAutofillCancelContext,
  VibeBackendAutofillSession,
  VibeBackendAutofillStartContext,
  VibeBackendAutofillUpdate,
  VibeCursor,
  VibeItem,
  VibePage,
} from '@/types'

const CHANNEL_NAME = 'vibe-demo-backend-autofill'
const STORAGE_KEY = 'vibe-demo-backend-autofill-v4'

interface StoredBackendJob {
  cycleId: string
  errorMessage?: string
  feed: VibePage
  feedKey: string
  initialReceived: number
  nextRequestAt: number | null
  pageSize: number
  received: number
  requests: number
  resultItems: VibeItem[]
  resultNext?: VibeCursor
  sequence: number
  sessionId: string
  sourceCursor: VibeCursor
  status: VibeBackendAutofillUpdate['status']
}

export interface BackendAutofillRestoration {
  initialPage: VibePage
  session: VibeAutofillSessionSnapshot
}

type UpdateListener = (update: VibeBackendAutofillUpdate) => void

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

type TerminalStatus = Extract<
  VibeBackendAutofillUpdate['status'],
  'complete' | 'exhausted'
>

function isTerminal(
  status: StoredBackendJob['status'],
): status is TerminalStatus {
  return ['complete', 'exhausted'].includes(status)
}

function parseJob(value: string | null): StoredBackendJob | null {
  if (!value) return null

  try {
    const job = JSON.parse(value) as Partial<StoredBackendJob>
    if (!job.sessionId || !job.feedKey || !job.feed || !Array.isArray(job.feed.items)) {
      return null
    }
    return job as StoredBackendJob
  } catch {
    return null
  }
}

export class BackendAutofillSimulator {
  private channel: BroadcastChannel | null = null
  private completing = false
  private listeners = new Set<UpdateListener>()
  private requestController: AbortController | null = null
  private timer: ReturnType<typeof setInterval> | null = null

  constructor() {
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel(CHANNEL_NAME)
      this.channel.addEventListener('message', (event: MessageEvent<unknown>) => {
        const update = event.data as Partial<VibeBackendAutofillUpdate>
        if (!update.sessionId || typeof update.sequence !== 'number') return
        this.notify(update as VibeBackendAutofillUpdate)
      })
    }
    window.addEventListener('storage', this.onStorage)
  }

  cancel(context: VibeBackendAutofillCancelContext): void {
    const job = this.read()
    if (!job || job.cycleId !== context.cycleId) return
    if (context.sessionId && job.sessionId !== context.sessionId) return

    this.requestController?.abort()
    job.sequence += 1
    job.nextRequestAt = null
    job.status = 'cancelled'
    this.write(job, true)
  }

  clear(): void {
    localStorage.removeItem(STORAGE_KEY)
  }

  destroy(): void {
    this.requestController?.abort()
    this.requestController = null
    if (this.timer !== null) clearInterval(this.timer)
    this.timer = null
    this.channel?.close()
    this.channel = null
    window.removeEventListener('storage', this.onStorage)
    this.listeners.clear()
  }

  getRestoration(): BackendAutofillRestoration | null {
    const job = this.read()
    if (!job) return null

    const items = isTerminal(job.status)
      ? appendUnique(job.feed.items, job.resultItems)
      : [...job.feed.items]
    const next = isTerminal(job.status) && job.resultNext !== undefined
      ? job.resultNext
      : job.feed.next

    return {
      initialPage: { items, next, total: job.feed.total },
      session: {
        ...this.toUpdate(job),
        cycleId: job.cycleId,
        pageSize: job.pageSize,
      },
    }
  }

  saveVisiblePage(page: VibePage): void {
    const job = this.read()
    if (!job) return
    job.feed = {
      items: [...page.items],
      next: page.next,
      total: page.total,
    }
    this.write(job, false)
  }

  start(context: VibeBackendAutofillStartContext): VibeBackendAutofillSession {
    const job = this.createJob(context, 1)
    this.write(job, false)

    return {
      nextRequestAt: job.nextRequestAt,
      received: job.received,
      sequence: job.sequence,
      sessionId: job.sessionId,
    }
  }

  seedInProgress(context: VibeBackendAutofillStartContext): void {
    this.write(this.createJob(context, 0), false)
  }

  private createJob(
    context: VibeBackendAutofillStartContext,
    requests: number,
  ): StoredBackendJob {
    return {
      cycleId: context.cycleId,
      feed: {
        items: [...context.items],
        next: context.next,
        total: context.total ?? undefined,
      },
      feedKey: context.feedKey,
      initialReceived: context.received,
      nextRequestAt: Date.now() + getRequestDelayMs(requests),
      pageSize: context.pageSize,
      received: context.received,
      requests,
      resultItems: [],
      sequence: 0,
      sessionId: `demo-${context.cycleId}`,
      sourceCursor: context.next,
      status: 'waiting',
    }
  }

  startMonitoring(): void {
    if (this.timer !== null) return
    this.timer = setInterval(() => { void this.tick() }, 250)
    void this.tick()
  }

  subscribe(listener: UpdateListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private async processNextPage(job: StoredBackendJob): Promise<void> {
    this.completing = true
    const requestController = new AbortController()
    this.requestController = requestController

    try {
      const page = await loadAutofillDemoPage({
        cursor: job.sourceCursor,
        signal: requestController.signal,
      })
      const current = this.read()
      if (
        !current
        || current.sessionId !== job.sessionId
        || current.sequence !== job.sequence
        || current.status !== 'waiting'
      ) {
        return
      }

      const known = appendUnique(current.feed.items, current.resultItems)
      const combined = appendUnique(known, page.items)
      current.resultItems.push(...combined.slice(known.length))
      current.received = current.initialReceived + current.resultItems.length
      current.requests += 1
      current.resultNext = page.next
      current.sourceCursor = page.next
      if (page.total !== undefined) current.feed.total = page.total
      current.sequence += 1
      current.status = current.received >= current.pageSize
        ? 'complete'
        : page.next === null ? 'exhausted' : 'waiting'
      current.nextRequestAt = current.status === 'waiting'
        ? Date.now() + getRequestDelayMs(current.requests)
        : null
      this.write(current, true)
    } catch (error: unknown) {
      if (requestController.signal.aborted) return
      const current = this.read()
      if (!current || current.status !== 'waiting') return
      current.errorMessage = error instanceof Error ? error.message : 'Autofill failed'
      current.nextRequestAt = null
      current.sequence += 1
      current.status = 'error'
      this.write(current, true)
    } finally {
      if (this.requestController === requestController) this.requestController = null
      this.completing = false
    }
  }

  private notify(update: VibeBackendAutofillUpdate): void {
    this.listeners.forEach((listener) => listener(update))
  }

  private readonly onStorage = (event: StorageEvent): void => {
    if (event.key !== STORAGE_KEY) return
    const job = parseJob(event.newValue)
    if (job) this.notify(this.toUpdate(job))
  }

  private read(): StoredBackendJob | null {
    return parseJob(localStorage.getItem(STORAGE_KEY))
  }

  private async tick(): Promise<void> {
    if (this.completing) return
    const job = this.read()
    if (!job || job.status !== 'waiting') return
    if (job.nextRequestAt !== null && Date.now() < job.nextRequestAt) return
    if (job.sourceCursor === null) {
      job.sequence += 1
      job.nextRequestAt = null
      job.status = 'exhausted'
      this.write(job, true)
      return
    }

    await this.processNextPage(job)
  }

  private toUpdate(job: StoredBackendJob): VibeBackendAutofillUpdate {
    const update = {
      error: job.errorMessage ? new Error(job.errorMessage) : undefined,
      feedKey: job.feedKey,
      nextRequestAt: job.nextRequestAt,
      received: job.received,
      requests: job.requests,
      sequence: job.sequence,
      sessionId: job.sessionId,
      total: job.feed.total,
    }

    if (isTerminal(job.status)) {
      return {
        ...update,
        items: job.resultItems,
        next: job.resultNext ?? null,
        status: job.status,
      }
    }

    return { ...update, status: job.status }
  }

  private write(job: StoredBackendJob, broadcast: boolean): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(job))
    if (!broadcast) return

    const update = this.toUpdate(job)
    this.notify(update)
    this.channel?.postMessage(update)
  }
}
