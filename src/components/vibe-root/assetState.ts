export interface MediaUiState {
  currentTime: number
  duration: number
  paused: boolean
  ready: boolean
}

export const DEFAULT_MEDIA_UI_STATE: MediaUiState = {
  currentTime: 0,
  duration: 0,
  paused: true,
  ready: false,
}

export function createMediaUiState(): MediaUiState {
  return { ...DEFAULT_MEDIA_UI_STATE }
}

export function isImageElementReady(element: HTMLImageElement) {
  return element.complete && Boolean(element.currentSrc || element.getAttribute('src'))
}

export function syncMediaUiState(state: MediaUiState, media: HTMLMediaElement, eventType?: string) {
  state.currentTime = Number.isFinite(media.currentTime) ? media.currentTime : 0
  state.duration = Number.isFinite(media.duration) ? media.duration : 0
  state.paused = media.paused
  state.ready = getMediaReadyState(media, eventType)
}

function getMediaReadyState(media: HTMLMediaElement, eventType?: string) {
  if (eventType === 'error') {
    return true
  }

  if (eventType === 'loadstart' || eventType === 'waiting' || eventType === 'stalled') {
    return false
  }

  if (eventType === 'canplay' || eventType === 'canplaythrough' || eventType === 'playing') {
    return true
  }

  return media.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
}
