export type DemoFeedMode = 'dynamic' | 'static'

export interface DemoFeedStatus {
  activeIndex: number
  currentCursor?: string | null
  fillCollectedCount?: number | null
  fillTargetCount?: number | null
  firstLoadedCursor?: string | null
  hasNextPage: boolean
  hasPreviousPage: boolean
  itemCount: number
  loadState: 'failed' | 'loaded' | 'loading'
  mode?: DemoFeedMode | null
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
    fill: string
    next: string
    previous: string
    status: string
    total: string
  }
  mode: DemoFeedMode
  pageSize: number
  testIdPrefix: string
}

export function createDemoFeedStatusEntries(status: DemoFeedStatus | null | undefined, options: DemoFeedStatusEntryOptions) {
  const currentCursor = resolveCurrentCursor(status, options)
  const nextCursor = status?.nextCursor ?? resolveNextCursor(status, options)
  const previousCursor = status?.previousCursor ?? (
    status?.hasPreviousPage ? resolvePreviousCursor(status, options) : 'N/A'
  )
  const fillCollectedCount = status?.fillCollectedCount ?? Math.min(status?.itemCount ?? options.pageSize, options.pageSize)
  const fillTargetCount = status?.fillTargetCount ?? options.pageSize
  const phase = status?.phase ?? status?.loadState ?? 'loaded'
  const mode = status?.mode ?? options.mode

  return [
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
      value: `${mode} · ${phase}`,
    },
    {
      key: 'fill',
      label: options.labels.fill,
      testId: `${options.testIdPrefix}-fill`,
      value: `${fillCollectedCount} / ${fillTargetCount}`,
    },
    {
      key: 'total',
      label: options.labels.total,
      testId: `${options.testIdPrefix}-total`,
      value: String(status?.itemCount ?? 0),
    },
  ] satisfies DemoFeedStatusEntry[]
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
