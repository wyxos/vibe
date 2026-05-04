<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { LoaderCircle } from 'lucide-vue-next'

import type { VibeViewerItem } from './viewer'
import { getItemIcon } from './viewer-core/media'
import { getListRenderableAsset, type VibeListRenderableAsset } from './viewer-core/listPreview'

interface FullscreenPreviewRailProps {
  activeIndex: number
  items: VibeViewerItem[]
  maxItems?: number
}

interface FullscreenPreviewItem {
  asset: VibeListRenderableAsset
  index: number
  item: VibeViewerItem
}

type PreviewLoadState = 'error' | 'loading' | 'ready'

const props = withDefaults(defineProps<FullscreenPreviewRailProps>(), {
  maxItems: 2,
})
const emit = defineEmits<{
  select: [index: number]
}>()
const previewLoadStates = ref<Record<string, PreviewLoadState>>({})

const previewItems = computed<FullscreenPreviewItem[]>(() => {
  const start = Math.min(Math.max(props.activeIndex + 1, 0), props.items.length)
  return props.items.slice(start, start + props.maxItems).map((item, offset) => ({
    asset: getListRenderableAsset(item),
    index: start + offset,
    item,
  }))
})

watch(
  previewItems,
  (items) => {
    const nextStates: Record<string, PreviewLoadState> = {}
    for (const preview of items) {
      const key = getPreviewKey(preview)
      if (isLoadablePreview(preview)) {
        nextStates[key] = previewLoadStates.value[key] ?? 'loading'
      }
    }
    previewLoadStates.value = nextStates
  },
  { immediate: true },
)

function getPreviewKey(preview: FullscreenPreviewItem) {
  return `${preview.item.id}:${preview.index}:${preview.asset.url ?? 'fallback'}`
}

function getPreviewLabel(preview: FullscreenPreviewItem) {
  return `Open item ${preview.index + 1} of ${props.items.length}: ${preview.asset.label}`
}

function getPreviewFitClass(asset: VibeListRenderableAsset) {
  return shouldCropPreview(asset) ? 'object-cover' : 'object-contain'
}

function shouldCropPreview(asset: VibeListRenderableAsset) {
  if (asset.width <= 0 || asset.height <= 0) {
    return false
  }

  const aspectRatio = asset.width / asset.height
  const emptyEdgeRatio = aspectRatio >= 1
    ? 1 - (1 / aspectRatio)
    : 1 - aspectRatio

  return emptyEdgeRatio >= 0.3
}

function isLoadablePreview(preview: FullscreenPreviewItem) {
  return Boolean(preview.asset.url) && (preview.asset.kind === 'image' || preview.asset.kind === 'video')
}

function isPreviewLoading(preview: FullscreenPreviewItem) {
  return isLoadablePreview(preview) && previewLoadStates.value[getPreviewKey(preview)] === 'loading'
}

function getPreviewOpacityClass(preview: FullscreenPreviewItem, readyClass: string) {
  return previewLoadStates.value[getPreviewKey(preview)] === 'ready'
    ? readyClass
    : 'opacity-0'
}

function settlePreview(preview: FullscreenPreviewItem, state: Exclude<PreviewLoadState, 'loading'>) {
  previewLoadStates.value = {
    ...previewLoadStates.value,
    [getPreviewKey(preview)]: state,
  }
}

function getPreviewButtonSizeClass(position: number) {
  return position === 0 ? 'h-[220px] w-[220px]' : 'h-[140px] w-[140px]'
}

function getPreviewReadyOpacityClass(position: number) {
  return position === 0 ? 'opacity-90' : 'opacity-40'
}
</script>

<template>
  <div
    v-if="previewItems.length"
    data-testid="vibe-fullscreen-next-previews"
    class="pointer-events-auto absolute right-[clamp(1.25rem,2.6vw,2.25rem)] top-1/2 z-[4] flex -translate-y-1/2 items-center justify-end gap-3 max-[860px]:hidden"
  >
    <button
      v-for="(preview, previewPosition) in previewItems"
      :key="`${preview.item.id}-${preview.index}`"
      type="button"
      data-testid="vibe-fullscreen-next-preview"
      :data-index="preview.index"
      :aria-label="getPreviewLabel(preview)"
      :title="preview.asset.label"
      class="group relative overflow-hidden border border-white/14 bg-black/45 text-[#f7f1ea] shadow-[0_20px_50px_-30px_rgba(0,0,0,0.9)] backdrop-blur-[18px] transition hover:border-white/34 hover:bg-black/58 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f7f1ea]"
      :class="getPreviewButtonSizeClass(previewPosition)"
      @click="emit('select', preview.index)"
    >
      <img
        v-if="preview.asset.kind === 'image'"
        :src="preview.asset.url ?? undefined"
        alt=""
        aria-hidden="true"
        draggable="false"
        loading="lazy"
        class="h-full w-full bg-black/18 object-center transition-[opacity,transform] duration-300 group-hover:scale-[1.04]"
        :class="[getPreviewFitClass(preview.asset), getPreviewOpacityClass(preview, getPreviewReadyOpacityClass(previewPosition))]"
        @error="settlePreview(preview, 'error')"
        @load="settlePreview(preview, 'ready')"
      >
      <video
        v-else-if="preview.asset.kind === 'video'"
        :src="preview.asset.url ?? undefined"
        aria-hidden="true"
        class="h-full w-full bg-black/18 object-center transition-[opacity,transform] duration-300 group-hover:scale-[1.04]"
        :class="[getPreviewFitClass(preview.asset), getPreviewOpacityClass(preview, getPreviewReadyOpacityClass(previewPosition))]"
        muted
        playsinline
        preload="metadata"
        @error="settlePreview(preview, 'error')"
        @loadedmetadata="settlePreview(preview, 'ready')"
      />
      <span
        v-else
        class="grid h-full w-full place-items-center bg-white/6"
        aria-hidden="true"
      >
        <component :is="getItemIcon(preview.item.type)" class="h-5 w-5 stroke-[1.9] text-[#f7f1ea]/70" />
      </span>

      <span
        v-if="preview.asset.kind === 'video'"
        class="pointer-events-none absolute left-2 top-2 inline-flex h-6 w-6 items-center justify-center border border-white/14 bg-black/55 backdrop-blur-[14px]"
        aria-hidden="true"
      >
        <component :is="getItemIcon(preview.item.type)" class="h-3.5 w-3.5 stroke-[2]" />
      </span>

      <span
        v-if="isPreviewLoading(preview)"
        data-testid="vibe-fullscreen-next-preview-spinner"
        class="pointer-events-none absolute inset-0 grid place-items-center bg-black/18"
        aria-hidden="true"
      >
        <span class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/50 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.85)] backdrop-blur-[18px]">
          <LoaderCircle class="h-4 w-4 animate-spin stroke-[1.9] text-[#f7f1ea]/82" />
        </span>
      </span>

      <span class="pointer-events-none absolute bottom-1.5 right-1.5 border border-white/14 bg-black/58 px-1.5 py-1 text-[0.56rem] font-bold leading-none tracking-[0.12em] text-[#f7f1ea]/78 backdrop-blur-[14px]">
        {{ preview.index + 1 }} / {{ props.items.length }}
      </span>
    </button>
  </div>
</template>
