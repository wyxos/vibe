import type {
  VibeReelAutoAdvanceOptions,
  VibeReelAutoAdvanceState,
} from '../types'

export const DEFAULT_REEL_AUTO_ADVANCE_INTERVAL_MS = 5_000

function validateInterval(intervalMs: number): void {
  if (!Number.isFinite(intervalMs) || intervalMs <= 0) {
    throw new TypeError('Vibe reelAutoAdvance.intervalMs must be a positive number.')
  }
}

export function validateReelAutoAdvanceOptions(
  options?: VibeReelAutoAdvanceOptions,
): void {
  if (options?.intervalMs !== undefined) validateInterval(options.intervalMs)
}

export function createReelAutoAdvanceState(
  options?: VibeReelAutoAdvanceOptions,
): VibeReelAutoAdvanceState {
  return {
    enabled: options?.enabled ?? false,
    includePostItems: options?.includePostItems ?? false,
    intervalMs: options?.intervalMs ?? DEFAULT_REEL_AUTO_ADVANCE_INTERVAL_MS,
  }
}

export function updateReelAutoAdvanceState(
  state: VibeReelAutoAdvanceState,
  update: boolean | VibeReelAutoAdvanceOptions,
): void {
  if (typeof update === 'boolean') {
    state.enabled = update
    return
  }

  validateReelAutoAdvanceOptions(update)
  if (update.enabled !== undefined) state.enabled = update.enabled
  if (update.includePostItems !== undefined) {
    state.includePostItems = update.includePostItems
  }
  if (update.intervalMs !== undefined) state.intervalMs = update.intervalMs
}
