/**
 * Composable for handling masonry item transitions
 */
export function useMasonryTransitions(masonry) {
  function onEnter(el, done) {
    // Set top to data-top
    const top = el.dataset.top
    requestAnimationFrame(() => {
      el.style.top = `${top}px`
      done()
    })
  }

  function onBeforeEnter(el) {
    // Set top to last item + offset
    const lastItem = masonry.value[masonry.value.length - 1]
    if (lastItem) {
      const lastTop = lastItem.top + lastItem.columnHeight + 10
      el.style.top = `${lastTop}px`
    } else {
      el.style.top = '0px'
    }
  }

  function onBeforeLeave(el) {
    // Ensure it's at its current position before animating
    el.style.transition = 'none'
    el.style.top = `${el.offsetTop}px`
    void el.offsetWidth // force reflow to flush style
    el.style.transition = '' // allow transition to apply again
  }

  function onLeave(el, done) {
    el.style.top = '-600px'
    el.style.opacity = '0'
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
