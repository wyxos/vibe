export interface VibeAssetLoadQueueLimits {
  maxGlobal: number
  maxPerDomain: number
  maxVideoPerDomain: number
}

export interface VibeAssetLoadRequest {
  assetType: 'image' | 'video'
  getPriority: () => number
  onGrant: () => void
  url: string
}

export interface VibeAssetLoadLease {
  cancel: () => void
  refresh: () => void
  release: () => void
}

interface InternalRequest extends VibeAssetLoadRequest {
  domain: string
  enqueuedAt: number
  id: string
}

const DEFAULT_LIMITS: VibeAssetLoadQueueLimits = {
  maxGlobal: 10,
  maxPerDomain: 4,
  maxVideoPerDomain: 2,
}

export function createAssetLoadQueue(limits: VibeAssetLoadQueueLimits = DEFAULT_LIMITS) {
  const activeRequests = new Map<string, InternalRequest>()
  const pendingRequests = new Map<string, InternalRequest>()
  let nextId = 0

  function request(options: VibeAssetLoadRequest): VibeAssetLoadLease {
    const entry: InternalRequest = {
      ...options,
      domain: getAssetDomain(options.url),
      enqueuedAt: nextId,
      id: `vibe-asset-load-${nextId += 1}`,
    }

    pendingRequests.set(entry.id, entry)
    processQueue()

    return {
      cancel() {
        if (pendingRequests.delete(entry.id) || activeRequests.delete(entry.id)) {
          processQueue()
        }
      },
      refresh() {
        processQueue()
      },
      release() {
        if (activeRequests.delete(entry.id) || pendingRequests.delete(entry.id)) {
          processQueue()
        }
      },
    }
  }

  function processQueue() {
    if (pendingRequests.size === 0) {
      return
    }

    const sortedPendingRequests = [...pendingRequests.values()].sort((left, right) => {
      const priorityDelta = getRequestPriority(left) - getRequestPriority(right)

      if (priorityDelta !== 0) {
        return priorityDelta
      }

      return left.enqueuedAt - right.enqueuedAt
    })

    for (const request of sortedPendingRequests) {
      if (activeRequests.size >= limits.maxGlobal) {
        return
      }

      if (!canGrant(request)) {
        continue
      }

      pendingRequests.delete(request.id)
      activeRequests.set(request.id, request)

      try {
        request.onGrant()
      }
      catch {
        activeRequests.delete(request.id)
      }
    }
  }

  function canGrant(request: InternalRequest) {
    const domainActiveRequests = [...activeRequests.values()].filter((entry) => entry.domain === request.domain)

    if (domainActiveRequests.length >= limits.maxPerDomain) {
      return false
    }

    if (request.assetType === 'video') {
      const domainActiveVideos = domainActiveRequests.filter((entry) => entry.assetType === 'video')

      if (domainActiveVideos.length >= limits.maxVideoPerDomain) {
        return false
      }
    }

    return true
  }

  return {
    request,
  }
}

export const defaultAssetLoadQueue = createAssetLoadQueue()

function getRequestPriority(request: InternalRequest) {
  try {
    const priority = request.getPriority()

    return Number.isFinite(priority) ? priority : Number.POSITIVE_INFINITY
  }
  catch {
    return Number.POSITIVE_INFINITY
  }
}

function getAssetDomain(url: string) {
  try {
    return new URL(url).hostname || 'local'
  }
  catch {
    return 'local'
  }
}
