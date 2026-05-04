export function isNativeFullscreenVideoElement(element: unknown) {
  const fullscreenDocument = typeof document === 'undefined'
    ? null
    : document as Document & { webkitFullscreenElement?: Element | null }

  return typeof document !== 'undefined'
    && typeof HTMLVideoElement !== 'undefined'
    && element instanceof HTMLVideoElement
    && (document.fullscreenElement === element || fullscreenDocument?.webkitFullscreenElement === element)
}

export function requestNativeVideoFullscreen(video: HTMLVideoElement) {
  const request = video.requestFullscreen?.bind(video)

  if (request) {
    const result = request()
    if (result && typeof result.catch === 'function') {
      void result.catch(() => {})
    }
    return
  }

  const legacyVideo = video as HTMLVideoElement & {
    webkitEnterFullscreen?: () => void
    webkitRequestFullscreen?: () => Promise<void> | void
  }

  if (legacyVideo.webkitEnterFullscreen) {
    legacyVideo.webkitEnterFullscreen()
    return
  }

  legacyVideo.webkitRequestFullscreen?.()
}
