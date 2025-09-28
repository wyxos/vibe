/**
 * Composable for handling masonry item transitions
 */
export function useMasonryTransitions(masonry) {
  function onEnter(el, done) {
    // Animate to its final transform (translate3d(left, top, 0)) with subtle scale/opacity
    const left = parseInt(el.dataset.left || '0', 10)
    const top = parseInt(el.dataset.top || '0', 10)
    const index = parseInt(el.dataset.index || '0', 10)

    // Small stagger per item, capped
    const delay = Math.min(index * 20, 160)

    // Apply delay only for the enter; avoid affecting move transitions
    const prevDelay = el.style.transitionDelay
    el.style.transitionDelay = `${delay}ms`

    requestAnimationFrame(() => {
      el.style.opacity = '1'
      el.style.transform = `translate3d(${left}px, ${top}px, 0) scale(1)`
      const clear = () => {
        el.style.transitionDelay = prevDelay || '' // restore
        el.removeEventListener('transitionend', clear)
        done()
      }
      el.addEventListener('transitionend', clear)
    })
  }

  function onBeforeEnter(el) {
    // Start slightly below and slightly smaller, faded
    const left = parseInt(el.dataset.left || '0', 10)
    const top = parseInt(el.dataset.top || '0', 10)
    el.style.opacity = '0'
    el.style.transform = `translate3d(${left}px, ${top + 10}px, 0) scale(0.985)`
  }

  function onBeforeLeave(el) {
    // Ensure it is at its current transform position before animating
    const left = parseInt(el.dataset.left || '0', 10)
    const top = parseInt(el.dataset.top || '0', 10)
    el.style.transition = 'none'
    el.style.opacity = '1'
    el.style.transform = `translate3d(${left}px, ${top}px, 0) scale(1)`
    void el.offsetWidth // force reflow to flush style
    el.style.transition = '' // allow transition to apply again
  }

  function onLeave(el, done) {
    const left = parseInt(el.dataset.left || '0', 10)
    const top = parseInt(el.dataset.top || '0', 10)

    // Read per-container leave duration (falls back to 200ms)
    const cs = getComputedStyle(el)
    const varVal = cs.getPropertyValue('--masonry-leave-duration') || ''
    const parsed = parseFloat(varVal)
    const leaveMs = Number.isFinite(parsed) && parsed > 0 ? parsed : 200

    // Temporarily shorten transition duration for this leaving element
    const prevDuration = el.style.transitionDuration

    // Run on next frame to ensure transition styles are applied
    const cleanup = () => {
      el.removeEventListener('transitionend', onEnd)
      clearTimeout(fallback)
      // restore inline duration if we touched it
      el.style.transitionDuration = prevDuration || ''
    }
    const onEnd = (e) => {
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
      // Ensure duration reflects leave speed
      el.style.transitionDuration = `${leaveMs}ms`
      el.style.opacity = '0'
      el.style.transform = `translate3d(${left}px, ${top + 10}px, 0) scale(0.985)`
      el.addEventListener('transitionend', onEnd)
    })
  }

  return {
    onEnter,
    onBeforeEnter,
    onBeforeLeave,
    onLeave
  }
}
