export interface VibeMasonryOverscanOptions {
  maximumPx?: number
  minimumPx?: number
  viewportMultiplier?: number
}

export interface VibeMasonryOptions {
  overscan?: VibeMasonryOverscanOptions
}

export const DEFAULT_MASONRY_OVERSCAN_MINIMUM_PX = 800
export const DEFAULT_MASONRY_OVERSCAN_VIEWPORT_MULTIPLIER = 1.5

export function resolveMasonryOverscan(
  options: VibeMasonryOptions | undefined,
  viewportHeight: number,
): number {
  const minimum = options?.overscan?.minimumPx
    ?? DEFAULT_MASONRY_OVERSCAN_MINIMUM_PX
  const multiplier = options?.overscan?.viewportMultiplier
    ?? DEFAULT_MASONRY_OVERSCAN_VIEWPORT_MULTIPLIER
  const uncapped = Math.max(minimum, viewportHeight * multiplier)
  const maximum = options?.overscan?.maximumPx
  return maximum === undefined ? uncapped : Math.min(uncapped, maximum)
}

export function validateMasonryOptions(options?: VibeMasonryOptions): void {
  const overscan = options?.overscan
  if (!overscan) return

  for (const [property, value] of [
    ['maximumPx', overscan.maximumPx],
    ['minimumPx', overscan.minimumPx],
    ['viewportMultiplier', overscan.viewportMultiplier],
  ] as const) {
    if (value !== undefined && (!Number.isFinite(value) || value < 0)) {
      throw new TypeError(
        `Vibe masonry overscan ${property} must be a non-negative number.`,
      )
    }
  }
  if (overscan.maximumPx !== undefined
    && overscan.minimumPx !== undefined
    && overscan.maximumPx < overscan.minimumPx) {
    throw new TypeError(
      'Vibe masonry overscan maximumPx must be greater than or equal to minimumPx.',
    )
  }
}
