export function abortListCardImageLoad(image: HTMLImageElement | null) {
  if (!image) {
    return
  }

  try {
    image.removeAttribute('src')
    image.src = ''
  }
  catch {
    // Ignore abort failures if the image element is already detached.
  }
}

export function abortListCardVideoLoad(video: HTMLVideoElement | null) {
  if (!video) {
    return
  }

  try {
    video.currentTime = 0
  }
  catch {
    // Ignore reset failures for streams or not-yet-ready media elements.
  }

  video.pause()

  try {
    video.removeAttribute('src')
    video.load()
  }
  catch {
    // Ignore abort failures if the video element is already detached.
  }
}

export function isListCardWithinViewport(itemBounds: DOMRectReadOnly | DOMRect, viewportBounds: DOMRectReadOnly | DOMRect | null) {
  if (viewportBounds) {
    return itemBounds.bottom > viewportBounds.top && itemBounds.top < viewportBounds.bottom
  }

  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0
  return itemBounds.bottom > 0 && itemBounds.top < viewportHeight
}

export function normalizeListCardAssetUrl(url: string | null) {
  if (!url) {
    return null
  }

  try {
    return new URL(url, window.location.href).href
  }
  catch {
    return url
  }
}
