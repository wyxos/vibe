import type {
  CreateVibeOptions,
  VibeCursor,
  VibeItem,
  VibeItemId,
  VibePageLoader,
  VibeRequestDelayOptions,
} from '../types'
import { validatePage, type LoadedPageRecord } from './page'
import { getRequestDelayMs, waitForRequestDelay } from './requestDelay'

interface ReconciliationResult {
  items: VibeItem[]
  lastCursor: VibeCursor
  next: VibeCursor
  pages: LoadedPageRecord[]
  replaceFrom: number
  status: 'complete' | 'paused'
  total?: number
}

interface ReconcileOptions {
  existingItems: readonly VibeItem[]
  loadPage: VibePageLoader
  shouldPause?: () => boolean
  signal: AbortSignal
}

interface ReconciliationSession {
  appended: Set<string>
  attributed: Set<string>
  cursor: VibeCursor
  items: VibeItem[]
  lastCursor: VibeCursor
  next: VibeCursor
  pages: LoadedPageRecord[]
  remainingRequests: number
  replaceFrom: number
  seenCursors: Set<string>
  total?: number
}

function identityKey(value: VibeItemId): string {
  return `${typeof value}:${String(value)}`
}

function cursorKey(cursor: VibeCursor): string {
  return `${typeof cursor}:${String(cursor)}`
}

function itemIds(items: readonly VibeItem[]): VibeItemId[] {
  return items.map(({ postId }) => postId)
}

export class RemovalReconciliationController {
  private readonly delay: VibeRequestDelayOptions
  private readonly enabled: boolean
  private readonly maxReplayPages: number
  private readonly pageSize: number
  private pages: LoadedPageRecord[] = []
  private pending: ReconciliationSession | null = null
  private readonly tombstones = new Set<string>()

  constructor(options: CreateVibeOptions) {
    const reconciliation = options.removalReconciliation
    this.enabled = Boolean(reconciliation)
    this.maxReplayPages = reconciliation?.maxReplayPages ?? 5
    this.pageSize = reconciliation?.pageSize ?? 0
    this.delay = options.autofill?.strategy === 'frontend'
      ? options.autofill
      : { delayMaxMs: 0, delayStepMs: 0 }
  }

  completeReconciliation(result: ReconciliationResult): void {
    if (result.status !== 'complete') return
    this.pages = [
      ...this.pages.slice(0, result.replaceFrom),
      ...result.pages,
    ].slice(-this.maxReplayPages)
    this.pending = null
  }

  filterItems(items: readonly VibeItem[]): VibeItem[] {
    if (!this.enabled || this.tombstones.size === 0) return [...items]
    return items.filter(({ postId }) => !this.tombstones.has(identityKey(postId)))
  }

  needsReconciliation(items: readonly VibeItem[]): boolean {
    return this.pending !== null || this.findUnderfilledPage(items) >= 0
  }

  hasPendingSession(): boolean {
    return this.pending !== null
  }

  recordPages(records: readonly LoadedPageRecord[]): void {
    if (!this.enabled || records.length === 0) return
    records.forEach((record) => this.recordPage(record))
    this.pages = this.pages.slice(-this.maxReplayPages)
  }

  remove(postIds: readonly VibeItemId[]): void {
    if (!this.enabled) return
    postIds.forEach((postId) => this.tombstones.add(identityKey(postId)))
  }

  reset(): void {
    this.pages = []
    this.pending = null
    this.tombstones.clear()
  }

  restore(postIds: readonly VibeItemId[]): void {
    if (!this.enabled) return
    postIds.forEach((postId) => this.tombstones.delete(identityKey(postId)))
  }

  async reconcile({
    existingItems,
    loadPage,
    shouldPause = () => false,
    signal,
  }: ReconcileOptions): Promise<ReconciliationResult> {
    const session = this.pending ?? this.createSession(existingItems)
    this.pending = session

    while (session.remainingRequests > 0) {
      const key = cursorKey(session.cursor)
      if (session.seenCursors.has(key)) {
        throw new Error('Vibe removal reconciliation received a repeated cursor.')
      }
      await waitForRequestDelay({
        delayMs: getRequestDelayMs(session.pages.length, this.delay),
        onChange: () => undefined,
        signal,
      })
      if (session.pages.length > 0 && shouldPause()) {
        return this.result(session, 'paused')
      }
      const page = validatePage(await loadPage({ cursor: session.cursor, signal }))
      session.seenCursors.add(key)
      const filtered = this.filterItems(page.items)
      const contributionIds: VibeItemId[] = []
      filtered.forEach((item) => {
        const itemKey = identityKey(item.postId)
        if (!session.attributed.has(itemKey)) {
          session.attributed.add(itemKey)
          contributionIds.push(item.postId)
        }
        if (!session.appended.has(itemKey)) {
          session.appended.add(itemKey)
          session.items.push(item)
        }
      })
      session.pages.push({
        contributionIds,
        cursor: session.cursor,
        next: page.next,
        returnedIds: itemIds(filtered),
      })
      session.lastCursor = session.cursor
      session.next = page.next
      session.remainingRequests -= 1
      if (page.total !== undefined) session.total = page.total
      if (session.next === null) session.remainingRequests = 0
      else session.cursor = session.next

      if (session.remainingRequests > 0 && shouldPause()) {
        return this.result(session, 'paused')
      }
    }

    return this.result(session, 'complete')
  }

  private createSession(existingItems: readonly VibeItem[]): ReconciliationSession {
    const replaceFrom = this.findUnderfilledPage(existingItems)
    const window = replaceFrom < 0 ? [] : this.pages.slice(replaceFrom)
    const first = window[0]
    if (!first) throw new Error('Vibe has no underfilled provider page to reconcile.')

    const released = new Set(
      window.flatMap(({ contributionIds }) => contributionIds.map(identityKey)),
    )
    const reserved = new Set(
      existingItems
        .map(({ postId }) => identityKey(postId))
        .filter((key) => !released.has(key)),
    )
    return {
      appended: new Set(existingItems.map(({ postId }) => identityKey(postId))),
      attributed: new Set(reserved),
      cursor: first.cursor,
      items: [],
      lastCursor: first.cursor,
      next: first.cursor,
      pages: [],
      remainingRequests: window.length,
      replaceFrom,
      seenCursors: new Set(),
    }
  }

  private result(
    session: ReconciliationSession,
    status: ReconciliationResult['status'],
  ): ReconciliationResult {
    return {
      items: [...session.items],
      lastCursor: session.lastCursor,
      next: session.next,
      pages: [...session.pages],
      replaceFrom: session.replaceFrom,
      status,
      total: session.total,
    }
  }

  private findUnderfilledPage(items: readonly VibeItem[]): number {
    if (!this.enabled || this.pages.length === 0) return -1
    const visible = new Set(items.map(({ postId }) => identityKey(postId)))
    return this.pages.findIndex(({ contributionIds }) => (
      contributionIds.filter((postId) => visible.has(identityKey(postId))).length
        < this.pageSize
    ))
  }

  private recordPage(record: LoadedPageRecord): void {
    const key = cursorKey(record.cursor)
    const existing = this.pages.findIndex(({ cursor }) => cursorKey(cursor) === key)
    if (existing >= 0) this.pages = this.pages.slice(0, existing)
    this.pages.push({
      ...record,
      contributionIds: [...record.contributionIds],
      returnedIds: [...record.returnedIds],
    })
  }
}
