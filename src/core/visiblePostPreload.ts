import type {
  VibeItem,
  VibeMediaSource,
} from '../types'
import {
  clampMediaIndex,
  mediaAssets,
  mediaVariantForSource,
} from './mediaAsset'
import { isTimedMedia } from './mediaType'

export const VISIBLE_POST_PRELOAD_CONCURRENCY = 6
export const VISIBLE_POST_TIMED_PRELOAD_CONCURRENCY = 2

export interface VisiblePostPreloadTarget {
  key: string
  src: string
  timed: boolean
}

type EntryState = 'queued' | 'loading' | 'ready' | 'failed'

interface PreloadEntry extends VisiblePostPreloadTarget {
  cancel: (() => void) | null
  element: HTMLImageElement | HTMLVideoElement | null
  refs: number
  state: EntryState
}

const entries = new Map<string, PreloadEntry>()
const queue: PreloadEntry[] = []
let active = 0
let activeTimed = 0

function targetKey(src: string, timed: boolean): string {
  return `${timed ? 'timed' : 'image'}:${src}`
}

export function visiblePostPreloadTargets(
  item: VibeItem,
  mediaIndex: number,
  mediaSource: VibeMediaSource,
): VisiblePostPreloadTarget[] {
  const assets = mediaAssets(item)
  if (assets.length < 2) return []

  const currentIndex = clampMediaIndex(item, mediaIndex)
  const indices: number[] = []
  for (let distance = 1; distance < assets.length; distance += 1) {
    const next = currentIndex + distance
    const previous = currentIndex - distance
    if (next < assets.length) indices.push(next)
    if (previous >= 0) indices.push(previous)
  }

  const seen = new Set<string>()
  return indices.flatMap((index) => {
    const asset = assets[index]
    if (!asset) return []
    const variant = mediaVariantForSource(asset, mediaSource)
    const timed = isTimedMedia(variant.type, variant.src)
    const key = targetKey(variant.src, timed)
    if (seen.has(key)) return []
    seen.add(key)
    return [{ key, src: variant.src, timed }]
  })
}

function clearElement(entry: PreloadEntry): void {
  const element = entry.element
  entry.element = null
  if (!element) return
  if (element instanceof HTMLVideoElement) {
    element.pause()
    element.removeAttribute('src')
    element.load()
  } else {
    element.removeAttribute('src')
  }
}

function removeEntry(entry: PreloadEntry): void {
  entries.delete(entry.key)
  const index = queue.indexOf(entry)
  if (index >= 0) queue.splice(index, 1)
  entry.cancel?.()
  entry.cancel = null
  clearElement(entry)
}

function start(entry: PreloadEntry): void {
  entry.state = 'loading'
  active += 1
  if (entry.timed) activeTimed += 1

  let settled = false
  let detachListeners = () => undefined
  const settle = (state: 'ready' | 'failed') => {
    if (settled) return
    settled = true
    detachListeners()
    active -= 1
    if (entry.timed) activeTimed -= 1
    entry.cancel = null
    entry.state = state
    if (state === 'failed') clearElement(entry)
    if (entry.refs === 0) removeEntry(entry)
    pump()
  }
  entry.cancel = () => {
    if (settled) return
    settled = true
    detachListeners()
    active -= 1
    if (entry.timed) activeTimed -= 1
    clearElement(entry)
    pump()
  }

  if (entry.timed) {
    const video = document.createElement('video')
    const ready = () => settle('ready')
    const failed = () => settle('failed')
    detachListeners = () => {
      video.removeEventListener('loadedmetadata', ready)
      video.removeEventListener('error', failed)
    }
    video.addEventListener('loadedmetadata', ready, { once: true })
    video.addEventListener('error', failed, { once: true })
    video.muted = true
    video.playsInline = true
    video.preload = 'metadata'
    video.src = entry.src
    entry.element = video
    video.load()
    return
  }

  const image = document.createElement('img')
  const ready = () => {
    if (typeof image.decode !== 'function') {
      settle('ready')
      return
    }
    void image.decode().then(
      () => settle('ready'),
      () => settle('failed'),
    )
  }
  const failed = () => settle('failed')
  detachListeners = () => {
    image.removeEventListener('load', ready)
    image.removeEventListener('error', failed)
  }
  image.addEventListener('load', ready, { once: true })
  image.addEventListener('error', failed, { once: true })
  image.decoding = 'async'
  image.fetchPriority = 'low'
  image.src = entry.src
  entry.element = image
}

function pump(): void {
  while (active < VISIBLE_POST_PRELOAD_CONCURRENCY) {
    const index = queue.findIndex((entry) => (
      entry.refs > 0
      && entry.state === 'queued'
      && (!entry.timed || activeTimed < VISIBLE_POST_TIMED_PRELOAD_CONCURRENCY)
    ))
    if (index < 0) return
    const [entry] = queue.splice(index, 1)
    if (entry) start(entry)
  }
}

export function acquireVisiblePostPreload(
  target: VisiblePostPreloadTarget,
): () => void {
  let entry = entries.get(target.key)
  if (!entry) {
    entry = {
      ...target,
      cancel: null,
      element: null,
      refs: 0,
      state: 'queued',
    }
    entries.set(entry.key, entry)
    queue.push(entry)
  }
  entry.refs += 1
  pump()

  let released = false
  return () => {
    if (released) return
    released = true
    entry!.refs -= 1
    if (entry!.refs === 0) removeEntry(entry!)
  }
}

export function visiblePostPreloadSchedulerSnapshot(): {
  active: number
  activeTimed: number
  entries: Array<{ key: string, refs: number, state: EntryState }>
} {
  return {
    active,
    activeTimed,
    entries: [...entries.values()].map(({ key, refs, state }) => ({ key, refs, state })),
  }
}

export function resetVisiblePostPreloadSchedulerForTests(): void {
  ;[...entries.values()].forEach(removeEntry)
  queue.splice(0)
  active = 0
  activeTimed = 0
}
