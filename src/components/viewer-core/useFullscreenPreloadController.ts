import { getCurrentScope, onScopeDispose, ref, watch, type Ref } from 'vue'

import type { VibeViewerItem } from '../viewer'
import { createAssetLoadQueue, type VibeAssetLoadLease } from './useAssetLoadQueue'

interface FullscreenBackgroundJob {
  index: number
  key: string
  lease: VibeAssetLoadLease
}

const FULLSCREEN_QUEUE_PRIORITY_BY_OFFSET: Record<number, number> = {
  1: 0,
  2: 1,
  [-1]: 2,
}

export function useFullscreenPreloadController(options: {
  active: Ref<boolean | undefined>
  items: Ref<VibeViewerItem[]>
  resolvedActiveIndex: Ref<number>
  getItemKey: (item: VibeViewerItem) => string
  onResetAssetState: (id: string) => void
}) {
  const attachedNeighborKeys = ref<Record<string, true>>({})
  const backgroundQueue = createAssetLoadQueue({
    maxGlobal: 1,
    maxPerDomain: 1,
    maxVideoPerDomain: 1,
  })

  const backgroundJobs = new Map<string, FullscreenBackgroundJob>()
  const imageElements = new Map<string, HTMLImageElement>()
  const mediaElements = new Map<string, HTMLMediaElement>()
  let lastAttachedKeys = new Set<string>()

  watch(
    [options.active, options.items, options.resolvedActiveIndex],
    () => {
      syncBackgroundPreloads()
    },
    {
      immediate: true,
    },
  )

  if (getCurrentScope()) {
    onScopeDispose(() => {
      clearBackgroundPreloads()
    })
  }

  function shouldAttachSlideAsset(index: number) {
    if (!options.active.value) {
      return false
    }

    const item = options.items.value[index]
    if (!item || !isPreloadableItem(item)) {
      return false
    }

    const itemKey = options.getItemKey(item)
    return itemKey === getActivePreloadableKey() || Boolean(attachedNeighborKeys.value[itemKey])
  }

  function registerImageElement(id: string, element: unknown) {
    if (element instanceof HTMLImageElement) {
      imageElements.set(id, element)

      if (isImageElementReady(element)) {
        settleBackgroundPreload(id)
      }
      return
    }

    imageElements.delete(id)
  }

  function registerMediaElement(id: string, element: unknown) {
    if (element instanceof HTMLMediaElement) {
      mediaElements.set(id, element)

      if (isMediaElementReady(element)) {
        settleBackgroundPreload(id)
      }
      return
    }

    mediaElements.delete(id)
  }

  function settleBackgroundPreload(id: string) {
    const job = backgroundJobs.get(id)
    if (!job) {
      return
    }

    job.lease.release()
    backgroundJobs.delete(id)
  }

  function clearBackgroundPreloads() {
    for (const job of backgroundJobs.values()) {
      job.lease.release()
    }

    backgroundJobs.clear()
    attachedNeighborKeys.value = {}
    syncAttachedAssets()
  }

  function syncBackgroundPreloads() {
    if (!options.active.value) {
      clearBackgroundPreloads()
      return
    }

    const desiredNeighbors = getDesiredNeighbors()
    const desiredNeighborKeys = new Set(desiredNeighbors.map((entry) => entry.key))
    const activeKey = getActivePreloadableKey()

    for (const key of lastAttachedKeys) {
      if (key !== activeKey && desiredNeighborKeys.has(key)) {
        setAttachedNeighbor(key, true)
      }
    }

    for (const key of Object.keys(attachedNeighborKeys.value)) {
      if (!desiredNeighborKeys.has(key)) {
        setAttachedNeighbor(key, false)
      }
    }

    for (const [key, job] of backgroundJobs.entries()) {
      if (!desiredNeighborKeys.has(key)) {
        job.lease.release()
        backgroundJobs.delete(key)
        continue
      }

      const desiredNeighbor = desiredNeighbors.find((entry) => entry.key === key)
      if (desiredNeighbor) {
        job.index = desiredNeighbor.index
      }
    }

    for (const desiredNeighbor of desiredNeighbors) {
      if (backgroundJobs.has(desiredNeighbor.key) || attachedNeighborKeys.value[desiredNeighbor.key]) {
        continue
      }

      let job!: FullscreenBackgroundJob
      job = {
        index: desiredNeighbor.index,
        key: desiredNeighbor.key,
        lease: backgroundQueue.request({
          assetType: desiredNeighbor.item.type === 'image' ? 'image' : 'video',
          getPriority: () => getBackgroundPriority(job.index),
          onGrant: () => {
            setAttachedNeighbor(desiredNeighbor.key, true)

            if (isAssetElementReady(desiredNeighbor.key, imageElements, mediaElements)) {
              settleBackgroundPreload(desiredNeighbor.key)
            }
          },
          url: desiredNeighbor.item.url,
        }),
      }
      backgroundJobs.set(desiredNeighbor.key, job)
    }

    for (const job of backgroundJobs.values()) {
      job.lease.refresh()
    }

    syncAttachedAssets()
  }

  function getDesiredNeighbors() {
    const activeIndex = options.resolvedActiveIndex.value
    const desiredOffsets = [1, 2, -1]

    return desiredOffsets
      .map((offset) => {
        const index = activeIndex + offset
        const item = options.items.value[index]

        if (!item || !isPreloadableItem(item)) {
          return null
        }

        return {
          index,
          item,
          key: options.getItemKey(item),
        }
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
  }

  function getActivePreloadableKey() {
    const item = options.items.value[options.resolvedActiveIndex.value]

    if (!options.active.value || !item || !isPreloadableItem(item)) {
      return null
    }

    return options.getItemKey(item)
  }

  function getBackgroundPriority(index: number) {
    if (!options.active.value) {
      return Number.POSITIVE_INFINITY
    }

    return FULLSCREEN_QUEUE_PRIORITY_BY_OFFSET[index - options.resolvedActiveIndex.value] ?? Number.POSITIVE_INFINITY
  }

  function syncAttachedAssets() {
    const nextAttachedKeys = new Set<string>()
    const activeKey = getActivePreloadableKey()

    if (activeKey) {
      nextAttachedKeys.add(activeKey)
    }

    for (const key of Object.keys(attachedNeighborKeys.value)) {
      nextAttachedKeys.add(key)
    }

    for (const key of lastAttachedKeys) {
      if (nextAttachedKeys.has(key)) {
        continue
      }

      abortAssetLoad(key)
      options.onResetAssetState(key)
    }

    lastAttachedKeys = nextAttachedKeys
  }

  function setAttachedNeighbor(key: string, attached: boolean) {
    if (attached) {
      if (attachedNeighborKeys.value[key]) {
        return
      }

      attachedNeighborKeys.value = {
        ...attachedNeighborKeys.value,
        [key]: true,
      }
      return
    }

    if (!attachedNeighborKeys.value[key]) {
      return
    }

    const nextAttachedNeighborKeys = { ...attachedNeighborKeys.value }
    delete nextAttachedNeighborKeys[key]
    attachedNeighborKeys.value = nextAttachedNeighborKeys
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
    clearBackgroundPreloads,
    registerImageElement,
    registerMediaElement,
    settleBackgroundPreload,
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
