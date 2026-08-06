export interface MasonryCadenceFrame {
  maxScrollTop: number
  running: boolean
  scrollTop: number
  speedPxPerSecond: number
  timestamp: number
}

export interface MasonryCadenceSnapshot {
  longTaskCount: number
  longTaskDurationMs: number
  longestPlateauMs: number
  mediaReadyCount: number
  mediaVisibleCount: number
  mountedWindowChanges: number
  p95FrameMs: number
  requestedDistancePx: number
  travelledDistancePx: number
  worstFrameMs: number
}

const FRAME_DELTA_BUCKET_LIMIT = 1_000
const MAX_AUTO_SCROLL_FRAME_DELTA_MS = 100
const MOVEMENT_EPSILON_PX = 0.1

export class MasonryCadenceTracker {
  private readonly frameHistogram = new Uint32Array(FRAME_DELTA_BUCKET_LIMIT + 1)
  private frameCount = 0
  private lastMountedSignature: string | null = null
  private lastProgressAt: number | null = null
  private lastScrollTop: number | null = null
  private lastTimestamp: number | null = null
  private readonly metrics: MasonryCadenceSnapshot = {
    longTaskCount: 0,
    longTaskDurationMs: 0,
    longestPlateauMs: 0,
    mediaReadyCount: 0,
    mediaVisibleCount: 0,
    mountedWindowChanges: 0,
    p95FrameMs: 0,
    requestedDistancePx: 0,
    travelledDistancePx: 0,
    worstFrameMs: 0,
  }

  recordFrame(frame: MasonryCadenceFrame): void {
    const previousTimestamp = this.lastTimestamp
    const previousScrollTop = this.lastScrollTop
    this.lastTimestamp = frame.timestamp
    this.lastScrollTop = frame.scrollTop
    if (previousTimestamp === null || previousScrollTop === null) {
      this.lastProgressAt = frame.running ? frame.timestamp : null
      return
    }

    const elapsed = Math.max(0, frame.timestamp - previousTimestamp)
    this.recordFrameDuration(elapsed)
    if (!frame.running) {
      this.lastProgressAt = null
      return
    }

    const travelled = Math.max(0, frame.scrollTop - previousScrollTop)
    this.metrics.travelledDistancePx += travelled
    if (previousScrollTop < frame.maxScrollTop - MOVEMENT_EPSILON_PX) {
      this.metrics.requestedDistancePx += frame.speedPxPerSecond
        * Math.min(MAX_AUTO_SCROLL_FRAME_DELTA_MS, elapsed)
        / 1_000
      const plateauStart = this.lastProgressAt ?? previousTimestamp
      this.metrics.longestPlateauMs = Math.max(
        this.metrics.longestPlateauMs,
        frame.timestamp - plateauStart,
      )
      if (travelled > MOVEMENT_EPSILON_PX) this.lastProgressAt = frame.timestamp
      return
    }

    this.lastProgressAt = frame.timestamp
  }

  recordLongTask(durationMs: number): void {
    this.metrics.longTaskCount += 1
    this.metrics.longTaskDurationMs += Math.max(0, durationMs)
  }

  recordMediaReady(): void {
    this.metrics.mediaReadyCount += 1
  }

  recordMediaVisible(): void {
    this.metrics.mediaVisibleCount += 1
  }

  recordMountedWindow(signature: string): void {
    if (this.lastMountedSignature !== null && this.lastMountedSignature !== signature) {
      this.metrics.mountedWindowChanges += 1
    }
    this.lastMountedSignature = signature
  }

  snapshot(): MasonryCadenceSnapshot {
    return { ...this.metrics, p95FrameMs: this.calculateP95FrameMs() }
  }

  private recordFrameDuration(durationMs: number): void {
    const bucket = Math.min(
      FRAME_DELTA_BUCKET_LIMIT,
      Math.max(0, Math.ceil(durationMs)),
    )
    this.frameHistogram[bucket] += 1
    this.frameCount += 1
    this.metrics.worstFrameMs = Math.max(this.metrics.worstFrameMs, durationMs)
  }

  private calculateP95FrameMs(): number {
    const target = Math.max(1, Math.ceil(this.frameCount * 0.95))
    let cumulative = 0
    for (let index = 0; index < this.frameHistogram.length; index += 1) {
      cumulative += this.frameHistogram[index] ?? 0
      if (cumulative < target) continue
      return index
    }
    return 0
  }
}
