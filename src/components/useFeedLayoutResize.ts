import { nextTick, onBeforeUnmount, watch, type Ref } from 'vue'

export function useFeedLayoutResize(
  layout: Readonly<Ref<'masonry' | 'list'>>,
  gallery: Readonly<Ref<HTMLElement | null>>,
) {
  let resize: Animation | undefined

  watch(layout, async (_, __, onCleanup) => {
    const card = gallery.value?.querySelector<HTMLElement>(
      '.masonry-item[data-feed-first]:not(.media-card--entering, .media-card--leaving, .media-card--preparing)',
    )
    if (!card?.animate || card.ownerDocument.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      resize?.cancel()
      return
    }

    // Read the currently displayed size so reversing mid-transition is continuous.
    const before = card.getBoundingClientRect()
    let superseded = false
    onCleanup(() => { superseded = true })
    await nextTick()
    if (superseded) return

    resize?.cancel()
    if (!card.isConnected) return
    const after = card.getBoundingClientRect()
    if (!before.width || !before.height || !after.width || !after.height
      || (before.width === after.width && before.height === after.height)) return

    // Scale the visual box while the packed dimensions stay at their final values.
    const animation = card.animate([
      { scale: `${before.width / after.width} ${before.height / after.height}`, transformOrigin: 'top left', zIndex: 1 },
      { scale: '1', transformOrigin: 'top left', zIndex: 1 },
    ], { duration: 420, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' })
    resize = animation
    void animation.finished.catch(() => {}).then(() => {
      if (resize === animation) resize = undefined
    })
  })

  onBeforeUnmount(() => resize?.cancel())
}
