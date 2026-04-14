import { computed, ref, watch, type Ref } from 'vue'

import type { VibeViewerItem } from '../viewer'
import { extractDominantImageTone, type DominantImageTone } from './dominantImageTone'

export function useFullscreenDominantTone(options: {
  activeItem: Ref<VibeViewerItem | null>
  getItemKey: (item: VibeViewerItem) => string
  isImageReady: (id: string) => boolean
  showDominantImageTone: Ref<boolean | undefined>
}) {
  const dominantToneByItemKey = ref<Record<string, DominantImageTone>>({})

  const activeItemKey = computed(() => options.activeItem.value ? options.getItemKey(options.activeItem.value) : null)
  const activeDominantTone = computed(() => {
    if (
      !options.showDominantImageTone.value
      || options.activeItem.value?.type !== 'image'
      || !activeItemKey.value
      || !options.isImageReady(activeItemKey.value)
    ) {
      return null
    }

    return dominantToneByItemKey.value[activeItemKey.value] ?? null
  })

  const activeStageToneStyle = computed<Record<string, string> | undefined>(() => {
    if (!activeDominantTone.value) {
      return undefined
    }

    const { r, g, b } = activeDominantTone.value
    return {
      background: `radial-gradient(circle at top center, rgba(${r},${g},${b},0.34) 0%, transparent 44%), linear-gradient(180deg,#0a0b10,#05060a)`,
    }
  })

  const activeSlideToneStyle = computed<Record<string, string> | undefined>(() => {
    if (!activeDominantTone.value) {
      return undefined
    }

    const { r, g, b } = activeDominantTone.value
    return {
      background: `radial-gradient(circle at center, rgba(${r},${g},${b},0.42) 0%, transparent 44%), linear-gradient(180deg,#0b0c11,#06070b)`,
    }
  })

  watch(
    () => options.showDominantImageTone.value,
    (showDominantImageTone) => {
      if (!showDominantImageTone) {
        dominantToneByItemKey.value = {}
      }
    },
  )

  function updateFromImageElement(id: string, image: HTMLImageElement) {
    if (!options.showDominantImageTone.value) {
      return
    }

    const dominant = extractDominantImageTone(image)
    if (!dominant) {
      return
    }

    dominantToneByItemKey.value[id] = dominant
  }

  return {
    activeStageToneStyle,
    activeSlideToneStyle,
    updateFromImageElement,
  }
}
