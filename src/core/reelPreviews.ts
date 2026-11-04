import { inject, type InjectionKey } from 'vue'
import type { CreateVibeOptions } from '../types'

export type ReelPreviewOptions = Pick<CreateVibeOptions,
  'reelPreviewCount' | 'reelPreviewPlacement' | 'reelPreviewTransition' | 'onReelPreviewCountChange' | 'resolveReelPreview'>

export const reelPreviewOptionsKey: InjectionKey<ReelPreviewOptions> = Symbol('reelPreviewOptions')

export function useReelPreviewOptions() {
  return inject(reelPreviewOptionsKey, {})
}

export function resolveReelPreviewCount(count: number) {
  return Number.isFinite(count) ? Math.max(1, Math.min(24, Math.trunc(count))) : 4
}
