import { ref } from 'vue'

const DYNAMIC_FILL_BASE_DELAY_MS = 1_000
const DYNAMIC_FILL_STEP_DELAY_MS = 250
const FILL_DELAY_TICK_MS = 100

export function getDynamicFillDelayMs(fillRequestIndex: number) {
  return DYNAMIC_FILL_BASE_DELAY_MS + Math.max(0, fillRequestIndex - 1) * DYNAMIC_FILL_STEP_DELAY_MS
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
