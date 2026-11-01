/** Demo-only staging experiment; the library keeps its existing entry motion. */
export function attachReelEntryReveal(root: HTMLElement) {
  let current: {
    overlay: HTMLElement; main: HTMLElement; spinner: HTMLElement;
    slideDone: boolean; originalInert: boolean; mediaKey: string | null;
  } | null = null

  function clear() {
    if (!current) return
    current.main.inert = current.originalInert
    current.spinner.remove()
    delete current.overlay.dataset.demoReelEntry
    current = null
  }
  function finishReveal() {
    if (!current) return
    current.overlay.dataset.demoReelEntry = 'ready'
    current.main.inert = current.originalInert
  }
  function sync() {
    const overlay = root.querySelector<HTMLElement>('.vibe-reel-overlay')
    if (current?.overlay !== overlay) clear()
    if (!overlay) return
    if (!current) {
      const main = overlay.querySelector<HTMLElement>('.reel-layout-main')
      if (!main) return
      const spinner = document.createElement('div')
      spinner.className = 'demo-reel-spinner'
      spinner.setAttribute('role', 'status')
      spinner.setAttribute('aria-label', 'Loading media')
      spinner.innerHTML = '<span class="demo-reel-spinner-ring" aria-hidden="true"></span>'
      current = { overlay, main, spinner, originalInert: main.inert, mediaKey: null,
        slideDone: matchMedia('(prefers-reduced-motion: reduce)').matches }
      overlay.dataset.demoReelEntry = 'waiting'
      main.inert = true
      overlay.append(spinner)
    }
    if (overlay.classList.contains('vibe-reel-viewer-leave-active')) return
    // Vue removes this class after the real CSS slide completes. This also
    // handles zero-duration motion without guessing an animation timeout.
    if (!overlay.classList.contains('vibe-reel-viewer-enter-active')
      && !overlay.getAnimations().some(animation => animation instanceof CSSTransition
        && animation.transitionProperty === 'transform'
        && (animation.playState === 'running' || animation.playState === 'paused'))) current.slideDone = true
    const feed = overlay.querySelector<HTMLElement>('.reel-feed')
    const mediaKey = `${feed?.dataset.activePostId}:${feed?.dataset.activeMediaIndex ?? '0'}`
    if (current.mediaKey !== null && current.mediaKey !== mediaKey
      && overlay.dataset.demoReelEntry === 'revealing') {
      overlay.dataset.demoReelEntry = 'waiting'
      current.spinner.hidden = false
    }
    current.mediaKey = mediaKey
    if (!current.slideDone || overlay.dataset.demoReelEntry !== 'waiting') return
    const card = [...overlay.querySelectorAll<HTMLElement>('.reel-item')]
      .find(item => item.dataset.postId === feed?.dataset.activePostId)
    const frame = [...(card?.querySelectorAll<HTMLElement>('.media-card-frame') ?? [])]
      .find(item => item.dataset.mediaIndex === (feed?.dataset.activeMediaIndex ?? '0')
        && !item.classList.contains('media-slide-next-leave-active')
        && !item.classList.contains('media-slide-previous-leave-active'))
    if (!frame?.querySelector('.media-preview--ready, .media-error')) return
    overlay.dataset.demoReelEntry = 'revealing'
    current.spinner.hidden = true
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) finishReveal()
  }
  function transitionEnd(event: TransitionEvent) {
    if (!current) return
    if (event.target === current.overlay && event.propertyName === 'transform') {
      current.slideDone = true
      sync()
    } else if (event.target === current.main && event.propertyName === 'opacity'
      && current.overlay.dataset.demoReelEntry === 'revealing') finishReveal()
  }
  const observer = new MutationObserver(sync)
  observer.observe(root, { childList: true, subtree: true, attributes: true,
    attributeFilter: ['class', 'data-active-post-id', 'data-active-media-index'] })
  root.addEventListener('transitionend', transitionEnd as EventListener)
  sync()
  return () => {
    observer.disconnect()
    root.removeEventListener('transitionend', transitionEnd as EventListener)
    clear()
  }
}
