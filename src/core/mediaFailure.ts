import type { VibeMediaLifecycleContext, VibeMediaSource } from '../types'

export interface VibeMediaErrorContext extends VibeMediaLifecycleContext {
  source: VibeMediaSource
  src: string
}

export type MediaFailure = Pick<VibeMediaErrorContext, 'mediaIndex' | 'source' | 'src'>
