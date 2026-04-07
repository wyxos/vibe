import type { Component } from 'vue'
import { AudioLines, Clapperboard, File, ImagePlus } from 'lucide-vue-next'

import type { VibeViewerType } from '../viewer'

const ITEM_ICON_BY_TYPE: Record<VibeViewerType, Component> = {
  image: ImagePlus,
  video: Clapperboard,
  audio: AudioLines,
  other: File,
}

const ITEM_LABEL_BY_TYPE: Record<VibeViewerType, string> = {
  image: 'Image',
  video: 'Video',
  audio: 'Audio',
  other: 'File',
}

export function getItemIcon(type: VibeViewerType) {
  return ITEM_ICON_BY_TYPE[type]
}

export function getItemLabel(type: VibeViewerType) {
  return ITEM_LABEL_BY_TYPE[type]
}
