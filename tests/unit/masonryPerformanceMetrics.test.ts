import { describe, expect, it } from 'vitest'

import { MasonryCadenceTracker } from '@/pages/masonryPerformanceMetrics'

describe('masonry performance cadence metrics', () => {
  it('tracks requested and travelled distance with a stalled frame', () => {
    const tracker = new MasonryCadenceTracker()
    tracker.recordFrame({
      maxScrollTop: 10_000,
      running: true,
      scrollTop: 0,
      speedPxPerSecond: 80,
      timestamp: 0,
    })
    tracker.recordFrame({
      maxScrollTop: 10_000,
      running: true,
      scrollTop: 1.28,
      speedPxPerSecond: 80,
      timestamp: 16,
    })
    tracker.recordFrame({
      maxScrollTop: 10_000,
      running: true,
      scrollTop: 9.28,
      speedPxPerSecond: 80,
      timestamp: 1_016,
    })

    expect(tracker.snapshot()).toMatchObject({
      longestPlateauMs: 1_000,
      requestedDistancePx: 9.28,
      travelledDistancePx: 9.28,
      worstFrameMs: 1_000,
    })
  })

  it('tracks lifecycle, mount-window, long-task, and frame percentile activity', () => {
    const tracker = new MasonryCadenceTracker()
    tracker.recordMountedWindow('1|2|3')
    tracker.recordMountedWindow('1|2|3')
    tracker.recordMountedWindow('2|3|4')
    tracker.recordMediaReady()
    tracker.recordMediaVisible()
    tracker.recordLongTask(75)
    tracker.recordFrame({
      maxScrollTop: 100,
      running: false,
      scrollTop: 0,
      speedPxPerSecond: 80,
      timestamp: 0,
    })
    tracker.recordFrame({
      maxScrollTop: 100,
      running: false,
      scrollTop: 0,
      speedPxPerSecond: 80,
      timestamp: 17,
    })

    expect(tracker.snapshot()).toMatchObject({
      longTaskCount: 1,
      longTaskDurationMs: 75,
      mediaReadyCount: 1,
      mediaVisibleCount: 1,
      mountedWindowChanges: 1,
      p95FrameMs: 17,
    })
  })
})
