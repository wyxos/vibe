import type { VibeAssetErrorKind } from './loadError'

export interface MediaUiState {
  currentTime: number
  duration: number
  paused: boolean
  ready: boolean
  errorKind: VibeAssetErrorKind | null
  muted: boolean
  volume: number
}

export const DEFAULT_MEDIA_UI_STATE: MediaUiState = {
  currentTime: 0,
  duration: 0,
  errorKind: null,
  muted: false,
  paused: true,
  ready: false,
  volume: 1,
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
  state.muted = media.muted
  state.paused = media.paused
  state.volume = Number.isFinite(media.volume) ? media.volume : state.volume
  if (eventType && eventType !== 'error') {
    state.errorKind = null
  }
  state.ready = getMediaReadyState(media, eventType)
}

function getMediaReadyState(media: HTMLMediaElement, eventType?: string) {
  if (eventType === 'error') {
    return false
  }

  if (eventType === 'loadstart' || eventType === 'waiting' || eventType === 'stalled') {
    return false
  }

  if (eventType === 'canplay' || eventType === 'canplaythrough' || eventType === 'playing') {
    return true
  }

  return media.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
}
