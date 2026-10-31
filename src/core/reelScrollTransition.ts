const REEL_SCROLL_DURATION_MS = 300

export function transitionReelScroll(
  element: HTMLElement,
  top: number,
  immediate: boolean,
): Promise<void> {
  const start = element.scrollTop
  if (immediate || Math.abs(start - top) <= 1) {
    element.scrollTop = top
    return Promise.resolve()
  }

  element.setAttribute('data-transitioning', '')
  const startedAt = performance.now()
  let frame = 0

  return new Promise((resolve) => {
    const step = (now: number) => {
      frame += 1
      const elapsed = Math.max(now - startedAt, frame * (1_000 / 60))
      const progress = Math.min(1, elapsed / REEL_SCROLL_DURATION_MS)
      const eased = 1 - (1 - progress) ** 3
      element.scrollTop = start + ((top - start) * eased)
      if (progress < 1) {
        requestAnimationFrame(step)
        return
      }

      element.removeAttribute('data-transitioning')
      element.scrollTop = top
      resolve()
    }

    requestAnimationFrame(step)
  })
}
