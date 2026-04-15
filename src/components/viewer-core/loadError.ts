export type VibeAssetErrorKind = 'generic' | 'not-found'

const assetProbeCache = new Map<string, Promise<VibeAssetErrorKind | null>>()

export function getVibeAssetErrorLabel(kind: VibeAssetErrorKind) {
  return kind === 'not-found' ? '404' : 'Load error'
}

export function canRetryVibeAssetError(kind: VibeAssetErrorKind | null | undefined) {
  return kind === 'generic'
}

export function resolveVibeAssetErrorKind(url: string) {
  return probeVibeAssetUrl(url).then((result) => result ?? 'generic')
}

export function probeVibeAssetUrl(url: string) {
  const cached = assetProbeCache.get(url)

  if (cached) {
    return cached
  }

  const nextResult = classifyVibeAssetUrl(url)
  assetProbeCache.set(url, nextResult)
  return nextResult
}

async function classifyVibeAssetUrl(url: string): Promise<VibeAssetErrorKind | null> {
  if (!isInspectableAssetUrl(url)) {
    return null
  }

  try {
    const response = await fetch(url, {
      method: 'HEAD',
    })

    if (response.ok) {
      return null
    }

    if (response.status === 404) {
      return 'not-found'
    }

    return 'generic'
  }
  catch {
    return 'generic'
  }
}

function isInspectableAssetUrl(url: string) {
  return /^(https?:\/\/|\/)/i.test(url)
}
