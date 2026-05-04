import type { Ref } from 'vue'

import type { VibeViewerItem } from '../viewer'
import { requestNativeVideoFullscreen } from './nativeVideoFullscreen'

export function useVideoFullscreen(options: {
  activeItem: Ref<VibeViewerItem | null>
  getItemKey: (item: VibeViewerItem) => string
}) {
  const videoElements = new Map<string, HTMLVideoElement>()

  function registerElement(id: string, element: unknown) {
    if (element instanceof HTMLVideoElement) {
      videoElements.set(id, element)
      return
    }

    videoElements.delete(id)
  }

  function request() {
    const item = options.activeItem.value
    const video = item?.type === 'video' ? videoElements.get(options.getItemKey(item)) : null

    if (!video) {
      return
    }

    requestNativeVideoFullscreen(video)
  }

  return {
    registerElement,
    request,
  }
}
