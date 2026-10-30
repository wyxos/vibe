/** Shared native scroll-snap selection rule for feed and controlled reels. */
export function reelIndexAtScrollOffset(top: number, height: number, count: number): number {
  if (height <= 0 || count <= 0) return 0
  return Math.min(count - 1, Math.max(0, Math.round(top / height)))
}
