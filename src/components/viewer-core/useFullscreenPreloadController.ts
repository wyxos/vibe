import { getCurrentScope, onScopeDispose, ref, watch, type Ref } from 'vue'

import type { VibeViewerItem } from '../viewer'
import { createAssetLoadQueue, type VibeAssetLoadLease } from './useAssetLoadQueue'

export type FullscreenSlidePreloadState = 'idle' | 'queued' | 'loading' | 'ready'

interface FullscreenPreloadEntry {
  index: number
  item: VibeViewerItem
  key: string
}

interface FullscreenPreloadJob extends FullscreenPreloadEntry {
  lease: VibeAssetLoadLease
}

const FULLSCREEN_PRELOAD_OFFSETS = [0, 1, 2, 3] as const

const FULLSCREEN_QUEUE_PRIORITY_BY_OFFSET: Record<number, number> = {
  0: 0,
  1: 1,
  2: 2,
  3: 3,
}

export function useFullscreenPreloadController(options: {
  active: Ref<boolean | undefined>
  items: Ref<VibeViewerItem[]>
  resolvedActiveIndex: Ref<number>
  getItemKey: (item: VibeViewerItem) => string
  isAssetReady: (id: string, item: VibeViewerItem) => boolean
  onResetAssetState: (id: string) => void
}) {
  const attachedKeys = ref<Record<string, true>>({})
  const preloadQueue = createAssetLoadQueue({
    maxGlobal: 3,
    maxPerDomain: 3,
    maxVideoPerDomain: 3,
  })

  const preloadJobs = new Map<string, FullscreenPreloadJob>()
  const imageElements = new Map<string, HTMLImageElement>()
  const mediaElements = new Map<string, HTMLMediaElement>()
  let lastAttachedKeys = new Set<string>()

  watch(
    [options.active, options.items, options.resolvedActiveIndex],
    () => {
      syncPreloads()
    },
    {
      immediate: true,
    },
  )

  if (getCurrentScope()) {
    onScopeDispose(() => {
      clearPreloads()
    })
  }

  function shouldAttachSlideAsset(index: number) {
    const preloadState = getSlidePreloadState(index)
    return preloadState === 'loading' || preloadState === 'ready'
  }

  function getSlidePreloadState(index: number): FullscreenSlidePreloadState {
    if (!options.active.value) {
      return 'idle'
    }

    const entry = getPreloadableEntry(index)
    if (!entry) {
      return 'idle'
    }

    if (attachedKeys.value[entry.key]) {
      return options.isAssetReady(entry.key, entry.item) ? 'ready' : 'loading'
    }

    return preloadJobs.has(entry.key) ? 'queued' : 'idle'
  }

  function registerImageElement(id: string, element: unknown) {
    if (element instanceof HTMLImageElement) {
      imageElements.set(id, element)

      if (isImageElementReady(element)) {
        settleAssetPreload(id)
      }
      return
    }

    imageElements.delete(id)
  }

  function registerMediaElement(id: string, element: unknown) {
    if (element instanceof HTMLMediaElement) {
      mediaElements.set(id, element)

      if (isMediaElementReady(element)) {
        settleAssetPreload(id)
      }
      return
    }

    mediaElements.delete(id)
  }

  function settleAssetPreload(id: string) {
    const job = preloadJobs.get(id)
    if (!job) {
      return
    }

    job.lease.release()
    preloadJobs.delete(id)
  }

  function clearPreloads() {
    for (const job of preloadJobs.values()) {
      job.lease.cancel()
    }

    preloadJobs.clear()
    attachedKeys.value = {}
    syncAttachedAssets()
  }

  function syncPreloads() {
    if (!options.active.value) {
      clearPreloads()
      return
    }

    const desiredEntries = getDesiredEntries()
    const desiredEntriesByKey = new Map(desiredEntries.map((entry) => [entry.key, entry]))
    const desiredKeys = new Set(desiredEntriesByKey.keys())

    for (const key of Object.keys(attachedKeys.value)) {
      if (!desiredKeys.has(key)) {
        setAttachedKey(key, false)
      }
    }

    for (const [key, job] of preloadJobs.entries()) {
      const desiredEntry = desiredEntriesByKey.get(key)

      if (!desiredEntry) {
        job.lease.cancel()
        preloadJobs.delete(key)
        continue
      }

      job.index = desiredEntry.index
      job.item = desiredEntry.item
    }

    for (const desiredEntry of desiredEntries) {
      if (options.isAssetReady(desiredEntry.key, desiredEntry.item)) {
        setAttachedKey(desiredEntry.key, true)
        settleAssetPreload(desiredEntry.key)
        continue
      }

      if (attachedKeys.value[desiredEntry.key] || preloadJobs.has(desiredEntry.key)) {
        continue
      }

      let job!: FullscreenPreloadJob
      job = {
        ...desiredEntry,
        lease: preloadQueue.request({
          assetType: desiredEntry.item.type === 'image' ? 'image' : 'video',
          getPriority: () => getPreloadPriority(job.index),
          onGrant: () => {
            setAttachedKey(desiredEntry.key, true)

            if (options.isAssetReady(desiredEntry.key, desiredEntry.item)
              || isAssetElementReady(desiredEntry.key, imageElements, mediaElements)) {
              settleAssetPreload(desiredEntry.key)
            }
          },
          url: desiredEntry.item.url,
        }),
      }
      preloadJobs.set(desiredEntry.key, job)
    }

    for (const job of preloadJobs.values()) {
      job.lease.refresh()
    }

    syncAttachedAssets()
  }

  function getDesiredEntries() {
    const activeIndex = options.resolvedActiveIndex.value

    return FULLSCREEN_PRELOAD_OFFSETS
      .map((offset) => getPreloadableEntry(activeIndex + offset))
      .filter((entry): entry is FullscreenPreloadEntry => Boolean(entry))
  }

  function getPreloadPriority(index: number) {
    if (!options.active.value) {
      return Number.POSITIVE_INFINITY
    }

    return FULLSCREEN_QUEUE_PRIORITY_BY_OFFSET[index - options.resolvedActiveIndex.value] ?? Number.POSITIVE_INFINITY
  }

  function getPreloadableEntry(index: number): FullscreenPreloadEntry | null {
    const item = options.items.value[index]
    if (!item || !isPreloadableItem(item)) {
      return null
    }

    return {
      index,
      item,
      key: options.getItemKey(item),
    }
  }

  function syncAttachedAssets() {
    const nextAttachedKeys = new Set(Object.keys(attachedKeys.value))

    for (const key of lastAttachedKeys) {
      if (nextAttachedKeys.has(key)) {
        continue
      }

      abortAssetLoad(key)
      options.onResetAssetState(key)
    }

    lastAttachedKeys = nextAttachedKeys
  }

  function setAttachedKey(key: string, attached: boolean) {
    if (attached) {
      if (attachedKeys.value[key]) {
        return
      }

      attachedKeys.value = {
        ...attachedKeys.value,
        [key]: true,
      }
      return
    }

    if (!attachedKeys.value[key]) {
      return
    }

    const nextAttachedKeys = { ...attachedKeys.value }
    delete nextAttachedKeys[key]
    attachedKeys.value = nextAttachedKeys
  }

  function abortAssetLoad(key: string) {
    const image = imageElements.get(key)
    if (image) {
      try {
        image.removeAttribute('src')
        image.src = ''
      }
      catch {
        // Ignore abort failures if the image element is already detached.
      }
    }

    const media = mediaElements.get(key)
    if (!media) {
      return
    }

    try {
      media.currentTime = 0
    }
    catch {
      // Ignore reset failures for streams or not-yet-ready media elements.
    }

    media.pause()

    try {
      media.removeAttribute('src')
      media.load()
    }
    catch {
      // Ignore abort failures if the media element is already detached.
    }
  }

  return {
    clearPreloads,
    getSlidePreloadState,
    registerImageElement,
    registerMediaElement,
    settleAssetPreload,
    shouldAttachSlideAsset,
  }
}

function isAssetElementReady(
  key: string,
  imageElements: Map<string, HTMLImageElement>,
  mediaElements: Map<string, HTMLMediaElement>,
) {
  const image = imageElements.get(key)
  if (image) {
    return isImageElementReady(image)
  }

  const media = mediaElements.get(key)
  if (media) {
    return isMediaElementReady(media)
  }

  return false
}

function isImageElementReady(element: HTMLImageElement) {
  return element.complete && Boolean(element.currentSrc || element.getAttribute('src'))
}

function isMediaElementReady(element: HTMLMediaElement) {
  const metadataReadyState = typeof HTMLMediaElement === 'undefined' ? 1 : HTMLMediaElement.HAVE_METADATA
  return element.readyState >= metadataReadyState
}

function isPreloadableItem(item: VibeViewerItem) {
  return item.type === 'image' || item.type === 'video' || item.type === 'audio'
}
