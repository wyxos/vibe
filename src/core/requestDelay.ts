import type { VibeRequestDelayOptions } from '../types'

export const DEFAULT_REQUEST_DELAY_STEP_MS = 2_000
export const DEFAULT_REQUEST_DELAY_MAX_MS = 10_000
const REQUEST_DELAY_TICK_MS = 250

export interface RequestDelaySnapshot {
  delayRemainingMs: number | null
  nextRequestAt: number | null
}

interface WaitForRequestDelayOptions {
  delayMs: number
  onChange: (snapshot: RequestDelaySnapshot) => void
  signal: AbortSignal
}

const emptySnapshot: RequestDelaySnapshot = {
  delayRemainingMs: null,
  nextRequestAt: null,
}

function nonNegativeInteger(value: number | undefined, fallback: number): number {
  return value === undefined ? fallback : Math.floor(value)
}

export function validateRequestDelayOptions(
  options: VibeRequestDelayOptions,
  name: string,
): void {
  for (const [field, value] of [
    ['delayStepMs', options.delayStepMs],
    ['delayMaxMs', options.delayMaxMs],
  ] as const) {
    if (value !== undefined && (!Number.isFinite(value) || value < 0)) {
      throw new TypeError(`Vibe ${name} ${field} must be a non-negative number.`)
    }
  }
}

export function getRequestDelayMs(
  completedRequests: number,
  options: VibeRequestDelayOptions = {},
): number {
  const step = nonNegativeInteger(
    options.delayStepMs,
    DEFAULT_REQUEST_DELAY_STEP_MS,
  )
  const maximum = nonNegativeInteger(
    options.delayMaxMs,
    DEFAULT_REQUEST_DELAY_MAX_MS,
  )

  return Math.min(Math.max(0, completedRequests) * step, maximum)
}

export function getRequestDelaySnapshot(
  nextRequestAt?: number | null,
): RequestDelaySnapshot {
  if (nextRequestAt == null || !Number.isFinite(nextRequestAt)) {
    return { ...emptySnapshot }
  }

  const remaining = Math.max(0, Math.floor(nextRequestAt - Date.now()))
  return remaining > 0
    ? { delayRemainingMs: remaining, nextRequestAt }
    : { ...emptySnapshot }
}

export async function waitForRequestDelay({
  delayMs,
  onChange,
  signal,
}: WaitForRequestDelayOptions): Promise<void> {
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError')
  if (delayMs <= 0) {
    onChange({ ...emptySnapshot })
    return
  }

  const nextRequestAt = Date.now() + delayMs
  onChange({ delayRemainingMs: delayMs, nextRequestAt })

  await new Promise<void>((resolve, reject) => {
    let settled = false
    const interval = setInterval(update, REQUEST_DELAY_TICK_MS)
    const timeout = setTimeout(() => finish(), delayMs)

    function cleanup(): void {
      clearInterval(interval)
      clearTimeout(timeout)
      signal.removeEventListener('abort', abort)
      onChange({ ...emptySnapshot })
    }

    function finish(error?: DOMException): void {
      if (settled) return
      settled = true
      cleanup()
      if (error) reject(error)
      else resolve()
    }

    function abort(): void {
      finish(new DOMException('Aborted', 'AbortError'))
    }

    function update(): void {
      const snapshot = getRequestDelaySnapshot(nextRequestAt)
      onChange(snapshot)
      if (snapshot.delayRemainingMs === null) finish()
    }

    signal.addEventListener('abort', abort, { once: true })
  })
}

export class RequestDelayCountdown {
  private interval: ReturnType<typeof setInterval> | null = null

  constructor(
    private readonly onChange: (snapshot: RequestDelaySnapshot) => void,
  ) {}

  clear(): void {
    if (this.interval !== null) clearInterval(this.interval)
    this.interval = null
    this.onChange({ ...emptySnapshot })
  }

  sync(nextRequestAt?: number | null): void {
    this.clear()
    const snapshot = getRequestDelaySnapshot(nextRequestAt)
    this.onChange(snapshot)
    if (snapshot.delayRemainingMs === null) return

    this.interval = setInterval(() => {
      const next = getRequestDelaySnapshot(nextRequestAt)
      this.onChange(next)
      if (next.delayRemainingMs === null) this.clear()
    }, REQUEST_DELAY_TICK_MS)
  }
}
