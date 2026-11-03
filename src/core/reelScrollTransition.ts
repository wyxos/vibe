const REEL_SCROLL_DURATION_MS = 300

export function transitionReelScroll(
  element: HTMLElement,
  getTop: () => number,
  immediate: boolean,
): Promise<void> {
  const start = element.scrollTop
  const top = getTop()
  if (immediate || Math.abs(start - top) <= 1) {
    element.scrollTop = top
    return Promise.resolve()
  }

  element.setAttribute('data-transitioning', '')
  const startedAt = performance.now()

  return new Promise((resolve) => {
    const step = (now: number) => {
      const elapsed = Math.max(0, now - startedAt)
      const progress = Math.min(1, elapsed / REEL_SCROLL_DURATION_MS)
      const eased = 1 - (1 - progress) ** 3
      element.scrollTop = start + ((getTop() - start) * eased)
      if (progress < 1) {
        requestAnimationFrame(step)
        return
      }

      element.removeAttribute('data-transitioning')
      element.scrollTop = getTop()
      resolve()
    }

    requestAnimationFrame(step)
  })
}
