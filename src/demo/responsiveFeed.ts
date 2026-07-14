export const TABLET_SHORT_EDGE = 600
const UNRELATED_SCREEN_RATIO = 1.5

export interface ResponsiveFeedOptions {
  hasHover: boolean
  screenHeight: number
  screenWidth: number
  viewportHeight: number
  viewportWidth: number
}

export function shouldForceSingleColumnFeed(
  options: ResponsiveFeedOptions,
): boolean {
  const screenShortEdge = Math.min(options.screenWidth, options.screenHeight)

  if (screenShortEdge > 0 && screenShortEdge < TABLET_SHORT_EDGE) {
    return true
  }

  const viewportShortEdge = Math.min(
    options.viewportWidth,
    options.viewportHeight,
  )
  const screenLooksUnrelated = screenShortEdge
    >= viewportShortEdge * UNRELATED_SCREEN_RATIO

  return !options.hasHover
    && viewportShortEdge > 0
    && viewportShortEdge < TABLET_SHORT_EDGE
    && screenLooksUnrelated
}

export function shouldForceSingleColumnForElement(element: HTMLElement): boolean {
  const view = element.ownerDocument.defaultView
  const documentElement = element.ownerDocument.documentElement
  const hasHover = typeof view?.matchMedia === 'function'
    && view.matchMedia('(hover: hover)').matches

  return shouldForceSingleColumnFeed({
    hasHover,
    screenHeight: view?.screen.height ?? 0,
    screenWidth: view?.screen.width ?? 0,
    viewportHeight: documentElement.clientHeight,
    viewportWidth: documentElement.clientWidth,
  })
}
