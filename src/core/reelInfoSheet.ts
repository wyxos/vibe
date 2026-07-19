import type {
  VibeReelInfoSheetOptions,
  VibeReelInfoSheetState,
} from '../types'

export function createReelInfoSheetState(
  options?: VibeReelInfoSheetOptions,
): VibeReelInfoSheetState {
  return {
    enabled: options?.enabled ?? false,
  }
}

export function setReelInfoSheetEnabled(
  state: VibeReelInfoSheetState,
  options: VibeReelInfoSheetOptions | undefined,
  enabled: boolean,
): void {
  if (enabled && !options) {
    throw new Error(
      'Vibe cannot enable reelInfoSheet without a configured component.',
    )
  }

  state.enabled = enabled
}
