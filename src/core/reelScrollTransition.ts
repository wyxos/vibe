const REEL_SCROLL_DURATION_MS = 300
const pendingScrolls = new WeakMap<HTMLElement, () => void>()

export function cancelReelScroll(element: HTMLElement) {
  pendingScrolls.get(element)?.()
}

export function transitionReelScroll(
  element: HTMLElement,
  getTop: () => number,
  immediate: boolean,
): Promise<void> {
  cancelReelScroll(element)
  const start = element.scrollTop
  const top = getTop()
  if (immediate || Math.abs(start - top) <= 1) {
    // Mandatory snap stops can intercept a jump across multiple reel items.
    if (immediate) element.setAttribute('data-transitioning', '')
    element.scrollTop = top
    if (immediate) element.removeAttribute('data-transitioning')
    return Promise.resolve()
  }

  element.setAttribute('data-transitioning', '')
  const startedAt = performance.now()

  return new Promise((resolve) => {
    let frame: number
    const finish = () => {
      cancelAnimationFrame(frame)
      pendingScrolls.delete(element)
      element.removeAttribute('data-transitioning')
      resolve()
    }
    const step = (now: number) => {
      const elapsed = Math.max(0, now - startedAt)
      const progress = Math.min(1, elapsed / REEL_SCROLL_DURATION_MS)
      const eased = 1 - (1 - progress) ** 3
      element.scrollTop = start + ((getTop() - start) * eased)
      if (progress < 1) {
        frame = requestAnimationFrame(step)
        return
      }

      element.scrollTop = getTop()
      finish()
    }

    pendingScrolls.set(element, finish)
    frame = requestAnimationFrame(step)
  })
}
