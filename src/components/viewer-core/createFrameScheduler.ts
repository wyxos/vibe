export function createFrameScheduler(callback: () => void) {
  let frame = 0

  return {
    cancel() {
      if (frame && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(frame)
        frame = 0
      }
    },
    schedule() {
      if (typeof requestAnimationFrame !== 'function') {
        callback()
        return
      }
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        callback()
      })
    },
  }
}
