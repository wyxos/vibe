/**
 * Composable for handling masonry item transitions
 */
export function useMasonryTransitions(masonry) {
  function onEnter(el, done) {
    // Animate to its final transform (translate3d(left, top, 0))
    const left = parseInt(el.dataset.left || '0', 10)
    const top = parseInt(el.dataset.top || '0', 10)
    requestAnimationFrame(() => {
      el.style.transform = `translate3d(${left}px, ${top}px, 0)`
      done()
    })
  }

  function onBeforeEnter(el) {
    // Start further below its final position for a clearer slide-in
    const left = parseInt(el.dataset.left || '0', 10)
    const top = parseInt(el.dataset.top || '0', 10)
    el.style.transform = `translate3d(${left}px, ${top + 60}px, 0)`
  }

  function onBeforeLeave(el) {
    // Ensure it is at its current transform position before animating
    el.style.transition = 'none'
    // No-op: transform already represents current position
    void el.offsetWidth // force reflow to flush style
    el.style.transition = '' // allow transition to apply again
  }

  function onLeave(el, done) {
    const left = parseInt(el.dataset.left || '0', 10)
    const top = parseInt(el.dataset.top || '0', 10)
    el.style.transform = `translate3d(${left}px, ${top - 600}px, 0)`
    const handler = () => {
      el.removeEventListener('transitionend', handler)
      done()
    }
    el.addEventListener('transitionend', handler)
  }

  return {
    onEnter,
    onBeforeEnter,
    onBeforeLeave,
    onLeave
  }
}
