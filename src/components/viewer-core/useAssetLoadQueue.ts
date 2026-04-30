export interface VibeAssetLoadRequest {
  assetType: 'image' | 'video' | 'probe'
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
  enqueuedAt: number
  id: string
}

export function createAssetLoadQueue() {
  const activeRequests = new Map<string, InternalRequest>()
  const pendingRequests = new Map<string, InternalRequest>()
  let nextId = 0

  function request(options: VibeAssetLoadRequest): VibeAssetLoadLease {
    const entry: InternalRequest = {
      ...options,
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
