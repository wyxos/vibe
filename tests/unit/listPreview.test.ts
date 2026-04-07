import { describe, expect, it } from 'vitest'

import type { VibeViewerItem } from '@/components/vibeViewer'

import { getListRenderableAsset } from '@/components/vibe-root/listPreview'

describe('listPreview', () => {
  it('prefers the preview asset for image tiles', () => {
    const asset = getListRenderableAsset({
      id: 'image-preview',
      type: 'image',
      title: 'Previewed image',
      url: 'https://example.com/image-preview.jpg',
      width: 1_920,
      height: 1_080,
      preview: {
        url: 'https://example.com/image-preview-thumb.jpg',
        width: 320,
        height: 180,
      },
    })

    expect(asset).toMatchObject({
      kind: 'image',
      label: 'Previewed image',
      url: 'https://example.com/image-preview-thumb.jpg',
    })
  })

  it('accepts extensionless HTTP image URLs when no preview exists', () => {
    const asset = getListRenderableAsset({
      id: 'image-http',
      type: 'image',
      title: 'HTTP image',
      url: 'https://example.com/assets/image-http',
      width: 1_920,
      height: 1_080,
    })

    expect(asset).toMatchObject({
      kind: 'image',
      label: 'HTTP image',
      url: 'https://example.com/assets/image-http',
    })
  })

  it('prefers a video preview when it is an actual video source', () => {
    const asset = getListRenderableAsset({
      id: 'video-preview',
      type: 'video',
      title: 'Previewed video',
      url: 'https://example.com/video-preview.mp4',
      width: 1_920,
      height: 1_080,
      preview: {
        url: 'https://example.com/video-preview-short.mp4',
        width: 320,
        height: 180,
      },
    })

    expect(asset).toMatchObject({
      kind: 'video',
      label: 'Previewed video',
      url: 'https://example.com/video-preview-short.mp4',
    })
  })

  it('falls back when the selected video source is not a video', () => {
    const asset = getListRenderableAsset({
      id: 'video-fallback',
      type: 'video',
      title: 'Broken video preview',
      url: 'https://example.com/video-fallback.mp4',
      width: 1_920,
      height: 1_080,
      preview: {
        url: 'https://example.com/video-fallback-thumb.jpg',
        width: 320,
        height: 180,
      },
    })

    expect(asset).toMatchObject({
      kind: 'fallback',
      label: 'Broken video preview',
      url: null,
    })
  })

  it('renders non-visual items as fallbacks even when preview URLs exist', () => {
    const asset = getListRenderableAsset({
      id: 'document-1',
      type: 'document',
      title: 'Document tile',
      url: 'https://example.com/document-1.pdf',
      preview: {
        url: 'https://example.com/document-1-preview.jpg',
      },
    } satisfies VibeViewerItem)

    expect(asset).toMatchObject({
      kind: 'fallback',
      label: 'Document tile',
      url: null,
    })
  })
})
