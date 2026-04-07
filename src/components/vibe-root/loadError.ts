export type VibeAssetErrorKind = 'generic' | 'not-found'

const errorKindCache = new Map<string, Promise<VibeAssetErrorKind>>()

export function getVibeAssetErrorLabel(kind: VibeAssetErrorKind) {
  return kind === 'not-found' ? '404' : 'Load error'
}

export function resolveVibeAssetErrorKind(url: string) {
  const cached = errorKindCache.get(url)

  if (cached) {
    return cached
  }

  const nextResult = classifyVibeAssetError(url)
  errorKindCache.set(url, nextResult)
  return nextResult
}

async function classifyVibeAssetError(url: string): Promise<VibeAssetErrorKind> {
  if (!isInspectableAssetUrl(url)) {
    return 'generic'
  }

  try {
    const response = await fetch(url, {
      method: 'HEAD',
    })

    if (!response.ok && response.status === 404) {
      return 'not-found'
    }
  }
  catch {
    return 'generic'
  }

  return 'generic'
}

function isInspectableAssetUrl(url: string) {
  return /^(https?:\/\/|\/)/i.test(url)
}
