import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  getRequestDelayMs,
  validateRequestDelayOptions,
  waitForRequestDelay,
  type RequestDelaySnapshot,
} from '@/core/requestDelay'

describe('request delay', () => {
  afterEach(() => vi.useRealTimers())

  it('increments from an immediate first request to the default cap', () => {
    expect(Array.from({ length: 8 }, (_, index) => getRequestDelayMs(index)))
      .toEqual([0, 2_000, 4_000, 6_000, 8_000, 10_000, 10_000, 10_000])
  })

  it('supports a custom step and maximum', () => {
    const options = { delayMaxMs: 250, delayStepMs: 100 }
    expect(Array.from({ length: 5 }, (_, index) => (
      getRequestDelayMs(index, options)
    ))).toEqual([0, 100, 200, 250, 250])
  })

  it('increments a custom step to the default maximum', () => {
    const options = { delayStepMs: 1_250 }
    expect(Array.from({ length: 10 }, (_, index) => (
      getRequestDelayMs(index, options)
    ))).toEqual([
      0,
      1_250,
      2_500,
      3_750,
      5_000,
      6_250,
      7_500,
      8_750,
      10_000,
      10_000,
    ])
  })

  it('rejects invalid public delay options', () => {
    expect(() => validateRequestDelayOptions(
      { delayStepMs: -1 },
      'frontend fill',
    )).toThrow('Vibe frontend fill delayStepMs must be a non-negative number.')
    expect(() => validateRequestDelayOptions(
      { delayMaxMs: Number.POSITIVE_INFINITY },
      'frontend autofill',
    )).toThrow('Vibe frontend autofill delayMaxMs must be a non-negative number.')
  })

  it('publishes a cancellable live countdown while waiting', async () => {
    vi.useFakeTimers()
    const changes: RequestDelaySnapshot[] = []
    const controller = new AbortController()
    const waiting = waitForRequestDelay({
      delayMs: 2_000,
      onChange: (snapshot) => changes.push(snapshot),
      signal: controller.signal,
    })

    expect(changes[0]).toMatchObject({ delayRemainingMs: 2_000 })
    await vi.advanceTimersByTimeAsync(1_000)
    expect(changes.at(-1)).toMatchObject({ delayRemainingMs: 1_000 })

    controller.abort()
    await expect(waiting).rejects.toMatchObject({ name: 'AbortError' })
    expect(changes.at(-1)).toEqual({
      delayRemainingMs: null,
      nextRequestAt: null,
    })
  })
})
