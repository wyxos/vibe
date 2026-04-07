import type { Component } from 'vue'
import { Boxes, Database, FileArchive, FileText } from 'lucide-vue-next'

import type { VibeViewerItem } from '@/components/vibeViewer'

export type FakeMediaFileKind = 'archive' | 'copy' | 'dataset' | 'document' | 'legal' | 'model'

export interface FakeMediaDemoItem extends VibeViewerItem {
  fileKind?: FakeMediaFileKind
}

const FILE_KIND_ICON_MAP: Record<FakeMediaFileKind, Component> = {
  archive: FileArchive,
  copy: FileText,
  dataset: Database,
  document: FileText,
  legal: FileText,
  model: Boxes,
}

export function getFakeMediaItemIcon(item: VibeViewerItem) {
  if (item.type !== 'other') {
    return null
  }

  const fileKind = (item as FakeMediaDemoItem).fileKind
  return fileKind ? FILE_KIND_ICON_MAP[fileKind] : null
}

export function getFakeMediaTypeLabel(item: VibeViewerItem) {
  if (item.type !== 'other') {
    return item.type
  }

  const fileKind = (item as FakeMediaDemoItem).fileKind
  return fileKind ?? item.type
}
