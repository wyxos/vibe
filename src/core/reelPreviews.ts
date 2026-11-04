import type { InjectionKey } from 'vue'
import type { CreateVibeOptions } from '../types'

export type ReelPreviewOptions = Pick<CreateVibeOptions,
  'reelPreviewCount' | 'onReelPreviewCountChange' | 'resolveReelPreview'>

export const reelPreviewOptionsKey: InjectionKey<ReelPreviewOptions> = Symbol('reelPreviewOptions')
