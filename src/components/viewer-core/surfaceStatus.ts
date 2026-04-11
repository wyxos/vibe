import type { VibeLoadPhase } from './removalState'
import type { VibeSurfaceStatusKind } from './surfaceSlots'

export interface VibeSurfaceStatus {
  kind: VibeSurfaceStatusKind
  message: string
}

export function resolveVibeSurfacePhase(options: {
  itemCount: number
  loading: boolean
  phase?: VibeLoadPhase | null
}): VibeLoadPhase {
  if (options.phase) {
    return options.phase
  }

  if (!options.loading) {
    return 'idle'
  }

  return options.itemCount > 0 ? 'loading' : 'initializing'
}

export function getVibeSurfaceStatus(options: {
  errorMessage?: string | null
  hasItems: boolean
  hasNextPage: boolean
  phase: VibeLoadPhase
  surface: 'fullscreen' | 'grid'
}): VibeSurfaceStatus | null {
  if (options.phase === 'failed') {
    return {
      kind: 'failed',
      message: options.errorMessage ?? (options.hasItems
        ? 'The viewer could not load more items.'
        : 'The viewer could not load items.'),
    }
  }

  if (options.phase === 'initializing') {
    return {
      kind: 'initializing',
      message: 'Loading the first page',
    }
  }

  if (options.phase === 'loading') {
    return {
      kind: 'loading-more',
      message: options.hasItems ? 'Loading more items' : 'Loading the first page',
    }
  }

  if (options.phase === 'filling') {
    return {
      kind: 'filling',
      message: 'Filling the view',
    }
  }

  if (options.phase === 'refreshing') {
    return {
      kind: 'refreshing',
      message: !options.hasNextPage && options.hasItems
        ? (options.surface === 'grid' ? 'Refreshing the end of the list' : 'Refreshing the end of the feed')
        : 'Refreshing visible items',
    }
  }

  if (!options.hasItems || options.hasNextPage) {
    return null
  }

  return {
    kind: 'end',
    message: options.surface === 'grid' ? 'End of list' : 'End of feed',
  }
}
