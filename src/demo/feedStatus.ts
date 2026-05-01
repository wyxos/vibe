export interface DemoFeedStatus {
  activeIndex: number
  currentCursor?: string | null
  fillCollectedCount?: number | null
  fillCompletedCalls?: number | null
  fillDelayRemainingMs?: number | null
  fillLoadedCount?: number | null
  fillMode?: 'count' | 'cursor' | 'end' | 'idle' | string | null
  fillProgress?: number | null
  fillTargetCalls?: number | null
  fillTargetCount?: number | null
  fillTotalCount?: number | null
  firstLoadedCursor?: string | null
  hasNextPage: boolean
  hasPreviousPage: boolean
  itemCount: number
  loadState: 'failed' | 'loaded' | 'loading'
  nextCursor?: string | null
  lastLoadedCursor?: string | null
  phase?: string | null
  previousCursor?: string | null
}

export interface DemoFeedStatusEntry {
  key: string
  label: string
  testId: string
  value: string
}

export interface DemoFeedStatusEntryOptions {
  baseCursor: number
  labels: {
    current: string
    delay?: string
    fill: string
    next: string
    previous: string
    status: string
    total: string
  }
  pageSize: number
  showDelay?: boolean
  testIdPrefix: string
}

export function createDemoFeedStatusEntries(status: DemoFeedStatus | null | undefined, options: DemoFeedStatusEntryOptions) {
  const currentCursor = resolveCurrentCursor(status, options)
  const nextCursor = status?.nextCursor ?? resolveNextCursor(status, options)
  const previousCursor = status?.previousCursor ?? (
    status?.hasPreviousPage ? resolvePreviousCursor(status, options) : 'N/A'
  )
  const fillCollectedCount = status?.fillCollectedCount ?? Math.min(status?.itemCount ?? options.pageSize, options.pageSize)
  const fillDelay = formatFillDelay(status?.fillDelayRemainingMs ?? null)
  const fillTargetCount = status?.fillTargetCount ?? options.pageSize
  const fillValue = resolveFillValue(status, `${fillCollectedCount} / ${fillTargetCount}`)
  const phase = status?.phase ?? status?.loadState ?? 'loaded'
  const statusValue = resolveStatusValue(status, phase)

  const entries = [
    {
      key: 'current',
      label: options.labels.current,
      testId: `${options.testIdPrefix}-current`,
      value: currentCursor,
    },
    {
      key: 'next',
      label: options.labels.next,
      testId: `${options.testIdPrefix}-next`,
      value: nextCursor,
    },
    {
      key: 'previous',
      label: options.labels.previous,
      testId: `${options.testIdPrefix}-previous`,
      value: previousCursor,
    },
    {
      key: 'status',
      label: options.labels.status,
      testId: `${options.testIdPrefix}-status`,
      value: statusValue,
    },
    {
      key: 'fill',
      label: options.labels.fill,
      testId: `${options.testIdPrefix}-fill`,
      value: fillValue,
    },
    {
      key: 'total',
      label: options.labels.total,
      testId: `${options.testIdPrefix}-total`,
      value: String(status?.itemCount ?? 0),
    },
  ] satisfies DemoFeedStatusEntry[]

  if (options.showDelay && options.labels.delay) {
    entries.splice(4, 0, {
      key: 'delay',
      label: options.labels.delay,
      testId: `${options.testIdPrefix}-delay`,
      value: fillDelay,
    })
  }

  return entries
}

function resolveFillValue(status: DemoFeedStatus | null | undefined, fallback: string) {
  const completedCalls = status?.fillCompletedCalls ?? 0
  const loadedCount = status?.fillLoadedCount ?? status?.itemCount ?? 0

  if (status?.fillTargetCalls != null) {
    return `${completedCalls} / ${status.fillTargetCalls} calls`
  }

  if (status?.fillTotalCount != null) {
    return `${loadedCount} / ${status.fillTotalCount} loaded`
  }

  if (completedCalls > 0) {
    return `${loadedCount} loaded / ${completedCalls} calls`
  }

  return fallback
}

function resolveStatusValue(status: DemoFeedStatus | null | undefined, phase: string) {
  if ((status?.itemCount ?? 0) === 0 && status?.loadState !== 'loading') {
    return 'no items available'
  }

  if ((status?.itemCount ?? 0) > 0 && !status?.hasNextPage && status?.loadState !== 'loading') {
    return 'end of list'
  }

  return phase
}

function resolveCurrentCursor(status: DemoFeedStatus | null | undefined, options: DemoFeedStatusEntryOptions) {
  if (status?.currentCursor) {
    return status.currentCursor
  }

  const firstLoadedCursor = parseCursor(status?.firstLoadedCursor) ?? options.baseCursor
  const activePage = firstLoadedCursor + Math.floor((status?.activeIndex ?? 0) / options.pageSize)
  return String(activePage)
}

function resolveNextCursor(status: DemoFeedStatus | null | undefined, options: DemoFeedStatusEntryOptions) {
  const lastLoadedCursor = parseCursor(status?.lastLoadedCursor)

  if (lastLoadedCursor !== null) {
    return status?.hasNextPage ? String(lastLoadedCursor + 1) : 'N/A'
  }

  const currentCursor = parseCursor(resolveCurrentCursor(status, options))
  if (currentCursor !== null && status?.hasNextPage) {
    return String(currentCursor + 1)
  }

  return 'N/A'
}

function resolvePreviousCursor(status: DemoFeedStatus | null | undefined, options: DemoFeedStatusEntryOptions) {
  const firstLoadedCursor = parseCursor(status?.firstLoadedCursor) ?? options.baseCursor

  if (status?.hasPreviousPage) {
    return String(firstLoadedCursor - 1)
  }

  return 'N/A'
}

function parseCursor(value: string | null | undefined) {
  if (!value) {
    return null
  }

  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : null
}

function formatFillDelay(value: number | null) {
  if (value == null) {
    return 'N/A'
  }

  return `${(Math.max(0, value) / 1000).toFixed(1)}s`
}
