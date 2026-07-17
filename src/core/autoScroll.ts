import type {
  VibeAutoScrollOptions,
  VibeAutoScrollState,
} from '../types'

export const DEFAULT_AUTO_SCROLL_MIN_SPEED = 20
export const DEFAULT_AUTO_SCROLL_MAX_SPEED = 240
export const DEFAULT_AUTO_SCROLL_SPEED = 80

const MAX_FRAME_DELTA_MS = 100

function validatePositiveSpeed(name: string, speed: number): void {
  if (!Number.isFinite(speed) || speed <= 0) {
    throw new TypeError(`Vibe ${name} must be a positive number.`)
  }
}

function clampSpeed(speed: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, speed))
}

export function validateAutoScrollOptions(options?: VibeAutoScrollOptions): void {
  if (!options) return

  const minimum = options.minSpeedPxPerSecond ?? DEFAULT_AUTO_SCROLL_MIN_SPEED
  const maximum = options.maxSpeedPxPerSecond ?? DEFAULT_AUTO_SCROLL_MAX_SPEED
  validatePositiveSpeed('autoScroll.minSpeedPxPerSecond', minimum)
  validatePositiveSpeed('autoScroll.maxSpeedPxPerSecond', maximum)
  if (minimum > maximum) {
    throw new TypeError(
      'Vibe autoScroll.minSpeedPxPerSecond cannot exceed maxSpeedPxPerSecond.',
    )
  }
  if (options.speedPxPerSecond !== undefined) {
    validatePositiveSpeed('autoScroll.speedPxPerSecond', options.speedPxPerSecond)
  }
}

export function createAutoScrollState(
  options?: VibeAutoScrollOptions,
): VibeAutoScrollState {
  const minSpeedPxPerSecond = options?.minSpeedPxPerSecond
    ?? DEFAULT_AUTO_SCROLL_MIN_SPEED
  const maxSpeedPxPerSecond = options?.maxSpeedPxPerSecond
    ?? DEFAULT_AUTO_SCROLL_MAX_SPEED

  return {
    enabled: options?.enabled ?? false,
    maxSpeedPxPerSecond,
    minSpeedPxPerSecond,
    paused: false,
    speedPxPerSecond: clampSpeed(
      options?.speedPxPerSecond ?? DEFAULT_AUTO_SCROLL_SPEED,
      minSpeedPxPerSecond,
      maxSpeedPxPerSecond,
    ),
  }
}

interface VibeAutoScrollControllerOptions {
  getScrollElement: () => HTMLElement | null
  state: VibeAutoScrollState
}

export class VibeAutoScrollController {
  private frame: number | null = null
  private lastTimestamp: number | null = null
  private mounted = false

  constructor(private readonly options: VibeAutoScrollControllerOptions) {}

  mount(): void {
    this.mounted = true
    this.schedule()
  }

  destroy(): void {
    this.mounted = false
    this.cancelFrame()
  }

  setEnabled(enabled: boolean, speedPxPerSecond?: number): void {
    if (speedPxPerSecond !== undefined) this.setSpeed(speedPxPerSecond)
    this.options.state.enabled = enabled
    this.options.state.paused = false
    this.lastTimestamp = null
    if (enabled) this.schedule()
    else this.cancelFrame()
  }

  setPaused(paused: boolean): void {
    if (!this.options.state.enabled) return
    this.options.state.paused = paused
    this.lastTimestamp = null
    if (paused) this.cancelFrame()
    else this.schedule()
  }

  setSpeed(speedPxPerSecond: number): void {
    validatePositiveSpeed('auto-scroll speed', speedPxPerSecond)
    const state = this.options.state
    state.speedPxPerSecond = clampSpeed(
      speedPxPerSecond,
      state.minSpeedPxPerSecond,
      state.maxSpeedPxPerSecond,
    )
  }

  private readonly tick = (timestamp: number): void => {
    this.frame = null
    const state = this.options.state
    if (!this.mounted || !state.enabled) return

    const element = state.paused ? null : this.options.getScrollElement()
    if (!element) {
      this.lastTimestamp = null
      this.schedule()
      return
    }

    if (this.lastTimestamp !== null) {
      const elapsed = Math.min(
        MAX_FRAME_DELTA_MS,
        Math.max(0, timestamp - this.lastTimestamp),
      )
      const maximumScrollTop = Math.max(0, element.scrollHeight - element.clientHeight)
      element.scrollTop = Math.min(
        maximumScrollTop,
        element.scrollTop + state.speedPxPerSecond * elapsed / 1_000,
      )
    }
    this.lastTimestamp = timestamp
    this.schedule()
  }

  private schedule(): void {
    if (!this.mounted || !this.options.state.enabled || this.frame !== null) return
    if (typeof requestAnimationFrame !== 'function') return
    this.frame = requestAnimationFrame(this.tick)
  }

  private cancelFrame(): void {
    if (this.frame !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.frame)
    }
    this.frame = null
    this.lastTimestamp = null
  }
}
