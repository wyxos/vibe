export function getVibeMasonryViewportHeight(viewport: HTMLElement | null, fallbackHeight: number) {
  return viewport?.clientHeight
    || Math.round(viewport?.getBoundingClientRect().height ?? 0)
    || window.innerHeight
    || fallbackHeight
    || 1
}

export function getVibeMasonryViewportWidth(viewport: HTMLElement | null, fallbackWidth: number, itemWidth: number) {
  return viewport?.clientWidth
    || Math.round(viewport?.getBoundingClientRect().width ?? 0)
    || window.innerWidth
    || fallbackWidth
    || itemWidth
}

export function getVibeMasonryDistanceFromBottom(
  viewport: HTMLElement | null,
  scrollTop: number,
  viewportHeight: number,
  containerHeight: number,
) {
  const scrollHeight = viewport?.scrollHeight ?? containerHeight
  return scrollHeight - (scrollTop + viewportHeight)
}

export function getVibeMasonryScrollbarThumbStyle(scrollbarThumbHeight: number, scrollbarThumbTop: number) {
  return {
    height: `${scrollbarThumbHeight}px`,
    transform: `translate3d(0, ${scrollbarThumbTop}px, 0)`,
  }
}
