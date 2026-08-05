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
  total?: number
}

interface ReconcileOptions {
  existingItems: readonly VibeItem[]
  loadPage: VibePageLoader
  signal: AbortSignal
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
    this.pages = [
      ...this.pages.slice(0, result.replaceFrom),
      ...result.pages,
    ].slice(-this.maxReplayPages)
  }

  filterItems(items: readonly VibeItem[]): VibeItem[] {
    if (!this.enabled || this.tombstones.size === 0) return [...items]
    return items.filter(({ postId }) => !this.tombstones.has(identityKey(postId)))
  }

  needsReconciliation(items: readonly VibeItem[]): boolean {
    return this.findUnderfilledPage(items) >= 0
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
    this.tombstones.clear()
  }

  restore(postIds: readonly VibeItemId[]): void {
    if (!this.enabled) return
    postIds.forEach((postId) => this.tombstones.delete(identityKey(postId)))
  }

  async reconcile({
    existingItems,
    loadPage,
    signal,
  }: ReconcileOptions): Promise<ReconciliationResult> {
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
    const visible = new Set(existingItems.map(({ postId }) => identityKey(postId)))
    const attributed = new Set(reserved)
    const appended = new Set(visible)
    const items: VibeItem[] = []
    const pages: LoadedPageRecord[] = []
    const seenCursors = new Set<string>()
    let cursor = first.cursor
    let lastCursor = cursor
    let next: VibeCursor = cursor
    let total: number | undefined

    for (let request = 0; request < window.length; request += 1) {
      const key = cursorKey(cursor)
      if (seenCursors.has(key)) {
        throw new Error('Vibe removal reconciliation received a repeated cursor.')
      }
      seenCursors.add(key)

      await waitForRequestDelay({
        delayMs: getRequestDelayMs(request, this.delay),
        onChange: () => undefined,
        signal,
      })
      const page = validatePage(await loadPage({ cursor, signal }))
      const filtered = this.filterItems(page.items)
      const contributionIds: VibeItemId[] = []
      filtered.forEach((item) => {
        const itemKey = identityKey(item.postId)
        if (!attributed.has(itemKey)) {
          attributed.add(itemKey)
          contributionIds.push(item.postId)
        }
        if (!appended.has(itemKey)) {
          appended.add(itemKey)
          items.push(item)
        }
      })
      pages.push({
        contributionIds,
        cursor,
        next: page.next,
        returnedIds: itemIds(filtered),
      })
      lastCursor = cursor
      next = page.next
      if (page.total !== undefined) total = page.total
      if (next === null) break
      cursor = next
    }

    return { items, lastCursor, next, pages, replaceFrom, total }
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
