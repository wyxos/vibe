import { nextTick } from 'vue'

import type { VibeViewerItem } from '@/components/viewer'

export function createImageItem(id: string, title?: string, overrides: Partial<VibeViewerItem> = {}): VibeViewerItem {
  return {
    id,
    type: 'image',
    title,
    url: `https://example.com/${id}.jpg`,
    width: 1_920,
    height: 1_080,
    preview: {
      url: `https://example.com/${id}-preview.jpg`,
      width: 320,
      height: 180,
    },
    ...overrides,
  }
}

export function createVideoItem(id: string, title?: string): VibeViewerItem {
  return {
    ...createImageItem(id, title),
    type: 'video',
    url: `https://example.com/${id}.mp4`,
    preview: {
      url: `https://example.com/${id}-preview.mp4`,
      width: 320,
      height: 180,
    },
  }
}

export function createAudioItem(id: string, title?: string): VibeViewerItem {
  return {
    id,
    type: 'audio',
    title,
    url: `https://example.com/${id}.mp3`,
    preview: {
      url: `https://example.com/${id}.mp3`,
    },
  }
}

export function createOtherItem(id: string, title?: string, overrides: Partial<VibeViewerItem> = {}): VibeViewerItem {
  return {
    id,
    type: 'other',
    title,
    url: `https://example.com/${id}.zip`,
    ...overrides,
  }
}

export async function flushDom() {
  await nextTick()
  await Promise.resolve()
  await nextTick()
}

export function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: width,
    writable: true,
  })
}

export function setViewportHeight(height: number) {
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: height,
    writable: true,
  })
}
