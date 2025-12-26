/**
 * Factory for masonry item transitions (typed)
 * Optimized for large item arrays by skipping DOM operations for items outside viewport
 */
export function createMasonryTransitions(
  refs: { container?: any; masonry?: any },
  opts?: { leaveDurationMs?: number; virtualizing?: { value: boolean } }
) {
  // Cache viewport bounds to avoid repeated calculations
  let cachedViewportTop = 0
  let cachedViewportBottom = 0
  let cachedViewportHeight = 0
  const VIEWPORT_BUFFER_PX = 1000 // Buffer zone for items near viewport

  // Check if item is in viewport (with buffer) - optimized to skip DOM reads
  function isItemInViewport(itemTop: number, itemHeight: number): boolean {
    // Update cached viewport bounds if container exists
    const container = refs.container?.value
    if (container) {
      const scrollTop = container.scrollTop
      const clientHeight = container.clientHeight
      cachedViewportTop = scrollTop - VIEWPORT_BUFFER_PX
      cachedViewportBottom = scrollTop + clientHeight + VIEWPORT_BUFFER_PX
      cachedViewportHeight = clientHeight
    }

    const itemBottom = itemTop + itemHeight
    return itemBottom >= cachedViewportTop && itemTop <= cachedViewportBottom
  }

  function onEnter(el: HTMLElement, done: () => void) {
    const left = parseInt(el.dataset.left || '0', 10)
    const top = parseInt(el.dataset.top || '0', 10)
    const index = parseInt(el.dataset.index || '0', 10)
    // Get height from computed style or use a reasonable fallback
    const height = el.offsetHeight || parseInt(getComputedStyle(el).height || '200', 10) || 200

    // Skip animation during virtualization - just set position immediately
    if (opts?.virtualizing?.value) {
      el.style.transition = 'none'
      el.style.opacity = '1'
      el.style.transform = `translate3d(${left}px, ${top}px, 0) scale(1)`
      el.style.removeProperty('--masonry-opacity-delay')
      requestAnimationFrame(() => {
        el.style.transition = ''
        done()
      })
      return
    }

    // Skip animation for items outside viewport - just set position immediately
    if (!isItemInViewport(top, height)) {
      el.style.opacity = '1'
      el.style.transform = `translate3d(${left}px, ${top}px, 0) scale(1)`
      el.style.transition = 'none'
      done()
      return
    }

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

    // Skip animation during virtualization
    if (opts?.virtualizing?.value) {
      el.style.transition = 'none'
      el.style.opacity = '1'
      el.style.transform = `translate3d(${left}px, ${top}px, 0) scale(1)`
      el.style.removeProperty('--masonry-opacity-delay')
      return
    }

    el.style.opacity = '0'
    el.style.transform = `translate3d(${left}px, ${top + 10}px, 0) scale(0.985)`
  }

  function onBeforeLeave(el: HTMLElement) {
    const left = parseInt(el.dataset.left || '0', 10)
    const top = parseInt(el.dataset.top || '0', 10)
    const height = el.offsetHeight || parseInt(getComputedStyle(el).height || '200', 10) || 200

    // Skip animation during virtualization
    if (opts?.virtualizing?.value) {
      // no-op; removal will be immediate in leave
      return
    }

    // Skip animation for items outside viewport
    if (!isItemInViewport(top, height)) {
      el.style.transition = 'none'
      return
    }

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
    const height = el.offsetHeight || parseInt(getComputedStyle(el).height || '200', 10) || 200

    // Skip animation during virtualization - remove immediately
    if (opts?.virtualizing?.value) {
      done()
      return
    }

    // Skip animation for items outside viewport - remove immediately
    if (!isItemInViewport(top, height)) {
      el.style.transition = 'none'
      el.style.opacity = '0'
      done()
      return
    }

    // Prefer explicit option, fallback to CSS variable for safety
    const fromOpts = typeof opts?.leaveDurationMs === 'number' ? opts!.leaveDurationMs : Number.NaN
    let leaveMs = Number.isFinite(fromOpts) && fromOpts > 0 ? fromOpts : Number.NaN
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
