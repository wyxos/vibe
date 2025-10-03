/**
 * Composable for handling masonry item transitions (typed)
 */
export function useMasonryTransitions(masonry: any, opts?: { leaveDurationMs?: number }) {
  function onEnter(el: HTMLElement, done: () => void) {
    const left = parseInt(el.dataset.left || '0', 10)
    const top = parseInt(el.dataset.top || '0', 10)
    const index = parseInt(el.dataset.index || '0', 10)

    const delay = Math.min(index * 20, 160)
    const prevOpacityDelay = el.style.getPropertyValue('--masonry-opacity-delay')
    el.style.setProperty('--masonry-opacity-delay', `${delay}ms`)

    requestAnimationFrame(() => {
      el.style.opacity = '1'
      el.style.transform = `translate3d(${left}px, ${top}px, 0) scale(1)`
      const clear = () => {
        if (prevOpacityDelay) {
          el.style.setProperty('--masonry-opacity-delay', prevOpacityDelay)
        } else {
          el.style.removeProperty('--masonry-opacity-delay')
        }
        el.removeEventListener('transitionend', clear)
        done()
      }
      el.addEventListener('transitionend', clear)
    })
  }

  function onBeforeEnter(el: HTMLElement) {
    const left = parseInt(el.dataset.left || '0', 10)
    const top = parseInt(el.dataset.top || '0', 10)
    el.style.opacity = '0'
    el.style.transform = `translate3d(${left}px, ${top + 10}px, 0) scale(0.985)`
  }

  function onBeforeLeave(el: HTMLElement) {
    const left = parseInt(el.dataset.left || '0', 10)
    const top = parseInt(el.dataset.top || '0', 10)
    el.style.transition = 'none'
    el.style.opacity = '1'
    el.style.transform = `translate3d(${left}px, ${top}px, 0) scale(1)`
    el.style.removeProperty('--masonry-opacity-delay')
    // Avoid forced reflow: re-enable transition on the next frame
    requestAnimationFrame(() => {
      el.style.transition = ''
    })
  }

  function onLeave(el: HTMLElement, done: () => void) {
    const left = parseInt(el.dataset.left || '0', 10)
    const top = parseInt(el.dataset.top || '0', 10)

    // Prefer explicit option, fallback to CSS variable for safety
    const fromOpts = typeof opts?.leaveDurationMs === 'number' ? opts!.leaveDurationMs : NaN
    let leaveMs = Number.isFinite(fromOpts) && fromOpts > 0 ? fromOpts : NaN
    if (!Number.isFinite(leaveMs)) {
      const cs = getComputedStyle(el)
      const varVal = cs.getPropertyValue('--masonry-leave-duration') || ''
      const parsed = parseFloat(varVal)
      leaveMs = Number.isFinite(parsed) && parsed > 0 ? parsed : 200
    }

    const prevDuration = el.style.transitionDuration

    const cleanup = () => {
      el.removeEventListener('transitionend', onEnd as any)
      clearTimeout(fallback)
      el.style.transitionDuration = prevDuration || ''
    }
    const onEnd = (e?: Event) => {
      if (!e || e.target === el) {
        cleanup()
        done()
      }
    }
    const fallback = setTimeout(() => {
      cleanup()
      done()
    }, leaveMs + 100)

    requestAnimationFrame(() => {
      el.style.transitionDuration = `${leaveMs}ms`
      el.style.opacity = '0'
      el.style.transform = `translate3d(${left}px, ${top + 10}px, 0) scale(0.985)`
      el.addEventListener('transitionend', onEnd as any)
    })
  }

  return {
    onEnter,
    onBeforeEnter,
    onBeforeLeave,
    onLeave
  }
}
