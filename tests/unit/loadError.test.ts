import { afterEach, describe, expect, it, vi } from 'vitest'

import { probeVibeAssetUrl, resolveVibeAssetErrorKind } from '@/components/viewer-core/loadError'

describe('probeVibeAssetUrl', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns null for successful HEAD probes', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      status: 200,
    })))

    await expect(probeVibeAssetUrl('https://example.com/audio.mp3')).resolves.toBeNull()
  })

  it('returns not-found for 404 HEAD probes', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: false,
      status: 404,
    })))

    await expect(probeVibeAssetUrl('https://example.com/audio-missing.mp3')).resolves.toBe('not-found')
  })

  it('returns generic for other failed HEAD probes', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: false,
      status: 500,
    })))

    await expect(probeVibeAssetUrl('https://example.com/audio-error.mp3')).resolves.toBe('generic')
  })
})

describe('resolveVibeAssetErrorKind', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('maps successful probes back to a generic load error classification', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      status: 200,
    })))

    await expect(resolveVibeAssetErrorKind('https://example.com/image-broken.jpg')).resolves.toBe('generic')
  })
})
