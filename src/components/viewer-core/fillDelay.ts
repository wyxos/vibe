import { ref } from 'vue'

export const DEFAULT_DYNAMIC_FILL_DELAY_MS = 2_000
export const DEFAULT_DYNAMIC_FILL_DELAY_STEP_MS = 1_000
const FILL_DELAY_TICK_MS = 100

export function getDynamicFillDelayMs(
  fillRequestIndex: number,
  baseDelayMs = DEFAULT_DYNAMIC_FILL_DELAY_MS,
  stepDelayMs = DEFAULT_DYNAMIC_FILL_DELAY_STEP_MS,
) {
  return baseDelayMs + Math.max(0, fillRequestIndex - 1) * stepDelayMs
}

export function normalizeDynamicFillDelayMs(value: number | undefined, fallback: number) {
  if (!Number.isFinite(value) || value == null || value < 0) {
    return fallback
  }

  return Math.floor(value)
}

export function useFillDelayCountdown() {
  const remainingMs = ref<number | null>(null)
  let intervalId: ReturnType<typeof setInterval> | null = null
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  let resolvePendingDelay: (() => void) | null = null

  function clear(resolvePending = false) {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }

    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }

    remainingMs.value = null

    if (resolvePending && resolvePendingDelay) {
      const nextResolve = resolvePendingDelay
      resolvePendingDelay = null
      nextResolve()
    }
  }

  async function wait(delayMs: number) {
    clear(true)

    if (delayMs <= 0) {
      return
    }

    remainingMs.value = delayMs

    await new Promise<void>((resolve) => {
      const startedAt = Date.now()
      let finished = false

      const finish = () => {
        if (finished) {
          return
        }

        finished = true
        resolvePendingDelay = null
        clear()
        resolve()
      }

      resolvePendingDelay = finish

      const updateRemaining = () => {
        const nextRemainingMs = Math.max(0, delayMs - (Date.now() - startedAt))
        remainingMs.value = nextRemainingMs

        if (nextRemainingMs <= 0) {
          finish()
        }
      }

      intervalId = setInterval(updateRemaining, FILL_DELAY_TICK_MS)
      timeoutId = setTimeout(finish, delayMs)
      updateRemaining()
    })
  }

  return {
    clear,
    remainingMs,
    wait,
  }
}
