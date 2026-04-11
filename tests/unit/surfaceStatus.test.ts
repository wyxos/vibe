import { describe, expect, it } from 'vitest'

import { getVibeSurfaceStatus, resolveVibeSurfacePhase } from '@/components/viewer-core/surfaceStatus'

describe('surfaceStatus', () => {
  it('derives initializing and loading phases when explicit phase is missing', () => {
    expect(resolveVibeSurfacePhase({
      itemCount: 0,
      loading: true,
      phase: null,
    })).toBe('initializing')

    expect(resolveVibeSurfacePhase({
      itemCount: 3,
      loading: true,
      phase: null,
    })).toBe('loading')
  })

  it('maps lifecycle phases to surface badge kinds and messages', () => {
    expect(getVibeSurfaceStatus({
      hasItems: false,
      hasNextPage: true,
      phase: 'initializing',
      surface: 'grid',
    })).toEqual({
      kind: 'initializing',
      message: 'Loading the first page',
    })

    expect(getVibeSurfaceStatus({
      hasItems: true,
      hasNextPage: true,
      phase: 'loading',
      surface: 'grid',
    })).toEqual({
      kind: 'loading-more',
      message: 'Loading more items',
    })

    expect(getVibeSurfaceStatus({
      hasItems: true,
      hasNextPage: true,
      phase: 'filling',
      surface: 'grid',
    })).toEqual({
      kind: 'filling',
      message: 'Filling the view',
    })

    expect(getVibeSurfaceStatus({
      hasItems: true,
      hasNextPage: false,
      phase: 'refreshing',
      surface: 'grid',
    })).toEqual({
      kind: 'refreshing',
      message: 'Refreshing the end of the list',
    })

    expect(getVibeSurfaceStatus({
      errorMessage: 'Temporary failure',
      hasItems: true,
      hasNextPage: true,
      phase: 'failed',
      surface: 'fullscreen',
    })).toEqual({
      kind: 'failed',
      message: 'Temporary failure',
    })

    expect(getVibeSurfaceStatus({
      hasItems: true,
      hasNextPage: false,
      phase: 'idle',
      surface: 'fullscreen',
    })).toEqual({
      kind: 'end',
      message: 'End of feed',
    })
  })
})
