import { computed, ref, watch, type ComputedRef, type Ref } from 'vue'

import type { VibeViewerItem } from '../viewer'
import type { VibeAssetErrorReporter } from './assetErrors'
import { getVibeOccurrenceKey } from './itemIdentity'
import { normalizeListCardAssetUrl } from './listCardAsset'
import { probeVibeAssetUrl, type VibeAssetErrorKind } from './loadError'
import { defaultAssetLoadQueue, type VibeAssetLoadLease } from './useAssetLoadQueue'

type UseListCardHealthCheckOptions = {
  attachedAssetUrl: ComputedRef<string | null>
  getPriority: () => number
  isInView: Ref<boolean>
  isReady: Ref<boolean>
  item: ComputedRef<VibeViewerItem>
  loadErrorKind: Ref<VibeAssetErrorKind | null>
  reportAssetError?: VibeAssetErrorReporter | null
  surfaceActive: ComputedRef<boolean>
}

export function useListCardHealthCheck(options: UseListCardHealthCheckOptions) {
  const errorKind = ref<VibeAssetErrorKind | null>(null)
  const healthCheckUrl = computed(() => {
    const url = typeof options.item.value.healthCheck?.url === 'string'
      ? normalizeListCardAssetUrl(options.item.value.healthCheck.url)
      : null

    if (!url || url === options.attachedAssetUrl.value) {
      return null
    }

    return url
  })

  let lease: VibeAssetLoadLease | null = null
  let runId = 0
  const results = new Map<string, VibeAssetErrorKind | null>()

  watch(healthCheckUrl, (nextUrl, previousUrl) => {
    if (nextUrl !== previousUrl) {
      errorKind.value = null
      release()
      runId += 1
    }
  })

  watch(
    [healthCheckUrl, options.surfaceActive, options.isInView, options.isReady, options.loadErrorKind],
    () => {
      sync()
    },
  )

  function sync() {
    const url = healthCheckUrl.value

    if (!url) {
      release()
      return
    }

    if (!options.surfaceActive.value || !options.isInView.value || !options.isReady.value || Boolean(options.loadErrorKind.value)) {
      release()
      return
    }

    if (results.has(url)) {
      errorKind.value = results.get(url) ?? null
      return
    }

    if (lease) {
      lease.refresh()
      return
    }

    lease = defaultAssetLoadQueue.request({
      assetType: 'probe',
      getPriority: options.getPriority,
      onGrant() {
        const currentUrl = healthCheckUrl.value
        if (!currentUrl) {
          release()
          return
        }

        const currentRunId = ++runId
        void probeVibeAssetUrl(currentUrl)
          .then((result) => {
            if (currentRunId !== runId || healthCheckUrl.value !== currentUrl) {
              return
            }

            results.set(currentUrl, result ?? null)
            if (!result) {
              errorKind.value = null
              return
            }

            errorKind.value = result
            options.reportAssetError?.({
              item: options.item.value,
              occurrenceKey: getVibeOccurrenceKey(options.item.value),
              url: currentUrl,
              kind: result,
              surface: 'grid',
            })
          })
          .finally(() => {
            if (currentRunId === runId) {
              release()
            }
          })
      },
      url,
    })
  }

  function retry() {
    const url = healthCheckUrl.value
    if (!errorKind.value || !url) {
      return false
    }

    results.delete(url)
    errorKind.value = null
    release()
    sync()
    return true
  }

  function release() {
    lease?.release()
    lease = null
  }

  return {
    errorKind,
    release,
    retry,
  }
}
