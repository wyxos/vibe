<script setup lang="ts">
import type { Component } from 'vue'
import { computed, onBeforeUnmount, onMounted, ref, toRef } from 'vue'
import { LoaderCircle, Pause, Play, TriangleAlert } from 'lucide-vue-next'
import FullscreenMediaBar from './FullscreenMediaBar.vue'
import type { VibeViewerItem } from './viewer'
import FullscreenHeader from './FullscreenHeader.vue'
import { getVibeOccurrenceKey } from './viewer-core/itemIdentity'
import type { VibeAssetErrorReporter, VibeAssetLoadReporter } from './viewer-core/assetErrors'
import type { VibeFullscreenStatusSlotProps, VibeSurfaceSlotProps } from './viewer-core/surfaceSlots'
import type { VibeControlledProps } from './viewer-core/useViewer'
import { useViewer } from './viewer-core/useViewer'
import { getItemIcon, getItemLabel } from './viewer-core/media'
import { hasRenderableSlotContent } from './viewer-core/slotContent'
import { getSlideToneClass, getStageToneClass } from './viewer-core/theme'
import './viewer-core/fullscreenMediaBar.css'
const props = withDefaults(defineProps<VibeControlledProps & {
  active?: boolean
  reportAssetError?: VibeAssetErrorReporter | null
  reportAssetLoad?: VibeAssetLoadReporter | null
  showBackToList?: boolean
}>(), {
  active: true,
  activeIndex: 0,
  hasNextPage: false,
  loading: false,
  paginationDetail: null,
  reportAssetError: null,
  reportAssetLoad: null,
  showBackToList: false,
  showEndBadge: true,
  showStatusBadges: true,
})
const slots = defineSlots<{
  'fullscreen-aside'?: (props: VibeSurfaceSlotProps) => unknown
  'fullscreen-header-actions'?: (props: VibeSurfaceSlotProps) => unknown
  'fullscreen-overlay'?: (props: VibeSurfaceSlotProps) => unknown
  'fullscreen-status'?: (props: VibeFullscreenStatusSlotProps) => unknown
  'item-icon'?: (props: { icon: Component; item: VibeViewerItem }) => unknown
}>()

const emit = defineEmits<{
  'back-to-list': []
  'update:activeIndex': [value: number]
}>()
const FULLSCREEN_ASIDE_COLUMN_BREAKPOINT_PX = 1_280
const FULLSCREEN_PRELOAD_AHEAD_COUNT = 2

const viewer = useViewer(
  props,
  (_event, value) => {
    emit('update:activeIndex', value)
  },
  {
    enabled: toRef(props, 'active'),
    onAssetError: props.reportAssetError ?? undefined,
    onAssetLoad: props.reportAssetLoad ?? undefined,
  },
)
const viewportWidth = ref(typeof window === 'undefined' ? FULLSCREEN_ASIDE_COLUMN_BREAKPOINT_PX : window.innerWidth || FULLSCREEN_ASIDE_COLUMN_BREAKPOINT_PX)

const activeStageToneClass = computed(() => getStageToneClass(viewer.activeItem.value?.type ?? 'image'))
const mediaStatusOffsetClass = computed(() =>
  viewer.activeMediaItem.value && !viewer.activeAssetErrorKind.value ? 'bottom-[5.8rem] max-[720px]:bottom-[7.4rem]' : 'bottom-[1.8rem] max-[720px]:bottom-[1.3rem]',
)
const showMediaBar = computed(() => Boolean(viewer.activeMediaItem.value) && !viewer.activeAssetErrorKind.value)
const mediaStageInsetClass = computed(() =>
  showMediaBar.value ? 'pb-[5.75rem] max-[720px]:pb-[7rem]' : ''
)
const fullscreenSlotProps = computed<VibeSurfaceSlotProps | null>(() => {
  const item = viewer.activeItem.value
  if (!item) {
    return null
  }
  return {
    hasNextPage: props.hasNextPage,
    index: viewer.resolvedActiveIndex.value,
    item,
    loading: props.loading,
    paginationDetail: props.paginationDetail,
    total: props.items.length,
  }
})
const fullscreenHeaderActionNodes = computed(() => {
  if (!fullscreenSlotProps.value || !slots['fullscreen-header-actions']) {
    return []
  }
  return slots['fullscreen-header-actions'](fullscreenSlotProps.value)
})
const fullscreenAsideNodes = computed(() => {
  if (!fullscreenSlotProps.value || !slots['fullscreen-aside']) {
    return []
  }
  return slots['fullscreen-aside'](fullscreenSlotProps.value)
})
const fullscreenStatusProps = computed<VibeFullscreenStatusSlotProps | null>(() => {
  if (!props.showStatusBadges || !fullscreenSlotProps.value || !viewer.statusMessage.value) {
    return null
  }
  return {
    ...fullscreenSlotProps.value,
    kind: viewer.isAtEnd.value && !viewer.hasNextPage.value && !viewer.loading.value ? 'end' : 'loading-more',
    message: viewer.statusMessage.value,
  }
})
const fullscreenStatusNodes = computed(() => {
  if (!fullscreenStatusProps.value || !slots['fullscreen-status']) {
    return []
  }

  return slots['fullscreen-status'](fullscreenStatusProps.value)
})
const gridLayoutStyle = computed(() => ({
  gridTemplateColumns: showFullscreenAsideAsColumn.value ? 'minmax(0, 1fr) 22rem' : 'minmax(0, 1fr) 0rem',
  transition: 'grid-template-columns 320ms cubic-bezier(0.22, 1, 0.36, 1)',
}))
const showFullscreenHeaderActions = computed(() => hasRenderableSlotContent(fullscreenHeaderActionNodes.value))
const showFullscreenAside = computed(() => hasRenderableSlotContent(fullscreenAsideNodes.value))
const showFullscreenAsideAsColumn = computed(() => showFullscreenAside.value && viewportWidth.value >= FULLSCREEN_ASIDE_COLUMN_BREAKPOINT_PX)
const showFullscreenAsideAsDrawer = computed(() => showFullscreenAside.value && !showFullscreenAsideAsColumn.value)
const showCustomFullscreenStatus = computed(() => hasRenderableSlotContent(fullscreenStatusNodes.value))

onMounted(() => {
  window.addEventListener('resize', updateViewportWidth)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateViewportWidth)
})

function getMediaActionLabel(action: 'Play' | 'Pause', item: NonNullable<typeof viewer.activeItem.value>) {
  const label = item.title?.trim()
  if (label) {
    return `${action} ${label}`
  }

  return `${action} ${getItemLabel(item.type).toLowerCase()}`
}

function isAssetLoading(index: number, item: (typeof props.items)[number]) {
  const itemKey = getItemKey(item)

  if (!shouldPreloadSlideAsset(index)) {
    return false
  }
  if (index !== viewer.resolvedActiveIndex.value) {
    return false
  }
  if (viewer.getAssetErrorKind(itemKey)) {
    return false
  }

  if (item.type === 'image') {
    return !viewer.isImageReady(itemKey)
  }

  if (item.type === 'video' || item.type === 'audio') {
    return !viewer.isMediaReady(itemKey)
  }

  return false
}

function getAssetErrorKind(item: (typeof props.items)[number]) {
  return viewer.getAssetErrorKind(getItemKey(item))
}

function getAssetErrorLabel(item: (typeof props.items)[number]) {
  return viewer.getAssetErrorLabel(getItemKey(item)) ?? 'Load error'
}

function isAssetErrored(index: number, item: (typeof props.items)[number]) {
  return shouldPreloadSlideAsset(index) && index === viewer.resolvedActiveIndex.value && Boolean(getAssetErrorKind(item))
}

function shouldPreloadSlideAsset(index: number) {
  const activeIndex = viewer.resolvedActiveIndex.value
  return props.active && index >= activeIndex && index <= activeIndex + FULLSCREEN_PRELOAD_AHEAD_COUNT
}

function getFullscreenImageSource(index: number, item: (typeof props.items)[number]) {
  return shouldPreloadSlideAsset(index) ? viewer.getImageSource(item) : undefined
}

function getFullscreenMediaSource(index: number, item: (typeof props.items)[number]) {
  return shouldPreloadSlideAsset(index) ? item.url : undefined
}

function getItemKey(item: (typeof props.items)[number]) {
  return getVibeOccurrenceKey(item)
}

function updateViewportWidth() {
  viewportWidth.value = window.innerWidth || FULLSCREEN_ASIDE_COLUMN_BREAKPOINT_PX
}
</script>

<template>
  <div
    class="relative h-full min-h-0 overflow-hidden bg-[#05060a] text-[#f7f1ea]"
  >
    <div class="absolute inset-0 transition-[background] duration-200" :class="activeStageToneClass" />
    <div
      class="relative z-[1] grid h-full min-h-0"
      :style="gridLayoutStyle"
    >
      <div
        ref="viewer.stageRef"
        data-testid="vibe-stage"
        class="relative h-full min-h-0 touch-none overflow-hidden"
        @pointerdown="viewer.onPointerDown"
        @pointermove="viewer.onPointerMove"
        @pointerup="viewer.onPointerUp"
        @pointercancel="viewer.onPointerCancel"
        @wheel="viewer.onWheel"
      >
        <div v-if="viewer.items.value.length > 0" class="relative h-full min-h-0">
          <article
            v-for="{ item, index } in viewer.renderedItems.value"
            :key="getItemKey(item)"
            data-testid="vibe-slide"
            :data-item-id="item.id"
            :data-occurrence-key="getItemKey(item)"
            :data-index="index"
            :data-active="index === viewer.resolvedActiveIndex.value"
            :aria-hidden="index === viewer.resolvedActiveIndex.value ? 'false' : 'true'"
            class="absolute inset-0 flex h-full min-h-full items-center justify-center will-change-transform"
            :class="index === viewer.resolvedActiveIndex.value ? 'pointer-events-auto' : 'pointer-events-none'"
            :style="viewer.getSlideStyle(index)"
          >
            <div class="absolute inset-0 opacity-85" :class="getSlideToneClass(item.type)" />

            <div
              v-if="viewer.isVisual(item)"
              class="relative z-[1] flex h-full w-full items-center justify-center overflow-hidden"
              :class="index === viewer.resolvedActiveIndex.value ? mediaStageInsetClass : ''"
            >
              <div
                v-if="isAssetLoading(index, item)"
                data-testid="vibe-asset-spinner"
                class="pointer-events-none absolute inset-0 z-[2] grid place-items-center"
              >
                <span class="inline-flex h-12 w-12 items-center justify-center rounded-full bg-black/45 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.85)] backdrop-blur-[18px]">
                  <LoaderCircle class="h-5 w-5 animate-spin stroke-[1.9] text-[#f7f1ea]/78" aria-hidden="true" />
                </span>
              </div>

              <div
                v-if="isAssetErrored(index, item)"
                data-testid="vibe-asset-error"
                :data-kind="getAssetErrorKind(item)"
                class="grid h-full w-full place-items-center"
              >
                <div class="grid justify-items-center gap-4 border border-white/14 bg-black/45 px-8 py-7 text-center backdrop-blur-[18px]">
                  <TriangleAlert class="h-7 w-7 stroke-[1.9] text-[#f7f1ea]/72" aria-hidden="true" />
                  <p class="m-0 text-[0.82rem] font-bold uppercase tracking-[0.28em] text-[#f7f1ea]/70">
                    {{ getAssetErrorLabel(item) }}
                  </p>
                  <button v-if="viewer.canRetryAsset(getItemKey(item))" type="button" class="inline-flex items-center justify-center border border-white/14 bg-black/35 px-4 py-2 text-[0.64rem] font-bold uppercase tracking-[0.22em] text-[#f7f1ea]/82 backdrop-blur-[18px] transition hover:border-white/28 hover:bg-black/50" @click.stop="viewer.retryAsset(getItemKey(item))">
                    Retry
                  </button>
                </div>
              </div>

              <img
                v-else-if="item.type === 'image'"
                :key="viewer.getAssetRenderKey(getItemKey(item))"
                :src="getFullscreenImageSource(index, item)"
                :alt="item.title ?? ''"
                draggable="false"
                class="block h-auto max-h-full w-auto max-w-full object-contain shadow-[0_40px_120px_-60px_rgba(0,0,0,0.9)] transition-opacity duration-300"
                :class="viewer.isImageReady(getItemKey(item)) ? 'opacity-100' : 'opacity-0'"
                :ref="(element) => viewer.registerImageElement(getItemKey(item), element)"
                @load="viewer.onImageLoad(getItemKey(item), item.url)"
                @error="viewer.onImageError(getItemKey(item), item.url)"
              />

              <video
                v-else
                :key="viewer.getAssetRenderKey(getItemKey(item))"
                class="block h-auto max-h-full w-auto max-w-full cursor-pointer object-contain shadow-[0_40px_120px_-60px_rgba(0,0,0,0.9)] transition-opacity duration-300"
                :class="viewer.isMediaReady(getItemKey(item)) ? 'opacity-100' : 'opacity-0'"
                playsinline
                muted
                :src="getFullscreenMediaSource(index, item)"
                :preload="shouldPreloadSlideAsset(index) ? 'metadata' : 'none'"
                :ref="(element) => viewer.registerVideoElement(getItemKey(item), element)"
                @click.stop="viewer.onVideoClick($event, getItemKey(item))"
                @canplay="viewer.onMediaEvent(getItemKey(item), $event)"
                @durationchange="viewer.onMediaEvent(getItemKey(item), $event)"
                @error="viewer.onMediaError(getItemKey(item), item.url)"
                @loadstart="viewer.onMediaEvent(getItemKey(item), $event)"
                @loadedmetadata="viewer.onMediaEvent(getItemKey(item), $event)"
                @pause="viewer.onMediaEvent(getItemKey(item), $event)"
                @play="viewer.onMediaEvent(getItemKey(item), $event)"
                @playing="viewer.onMediaEvent(getItemKey(item), $event)"
                @seeking="viewer.onMediaEvent(getItemKey(item), $event)"
                @seeked="viewer.onMediaEvent(getItemKey(item), $event)"
                @stalled="viewer.onMediaEvent(getItemKey(item), $event)"
                @timeupdate="viewer.onMediaEvent(getItemKey(item), $event)"
                @waiting="viewer.onMediaEvent(getItemKey(item), $event)"
              />
            </div>

            <div
              v-else-if="viewer.isAudio(item)"
              class="relative z-[1] grid w-full max-w-[1100px] justify-items-center gap-6 px-[clamp(2rem,4vw,3rem)] py-[clamp(2rem,4vw,3rem)] text-center"
              :class="index === viewer.resolvedActiveIndex.value ? mediaStageInsetClass : ''"
            >
              <div class="relative grid aspect-square w-[clamp(320px,46vw,560px)] max-w-[calc(100vw-2.5rem)] place-items-center">
                <button
                  type="button"
                  class="relative grid h-full w-full place-items-center border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02)),radial-gradient(circle_at_center,rgba(16,185,129,0.14),transparent_58%)] text-[#f7f1ea] transition-[border-color,background] duration-200 hover:border-white/30 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03)),radial-gradient(circle_at_center,rgba(16,185,129,0.18),transparent_58%)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f7f1ea]"
                  :aria-label="(viewer.mediaStates.value[getItemKey(item)]?.paused ?? true) ? getMediaActionLabel('Play', item) : getMediaActionLabel('Pause', item)"
                  :disabled="Boolean(getAssetErrorKind(item))"
                  @click="viewer.onAudioCoverClick($event, getItemKey(item))"
                >
                  <span class="pointer-events-none absolute inset-0 border border-white/8 bg-[radial-gradient(circle,rgba(16,185,129,0.16),transparent_66%)]" />
                  <span class="pointer-events-none absolute h-[clamp(220px,30vw,360px)] w-[clamp(220px,30vw,360px)] border border-white/8 bg-[radial-gradient(circle,rgba(255,255,255,0.08),transparent_62%)]" />

                  <span class="relative z-[1] inline-flex min-h-[4.25rem] min-w-[4.25rem] items-center justify-center border border-white/18 bg-emerald-500/12 p-4 backdrop-blur-[20px]">
                    <slot name="item-icon" :icon="getItemIcon(item.type)" :item="item">
                      <component :is="getItemIcon(item.type)" class="h-6 w-6 stroke-[1.9]" aria-hidden="true" />
                    </slot>
                  </span>

                  <span class="pointer-events-none absolute bottom-4 right-4 inline-flex h-10 w-10 items-center justify-center border border-white/14 bg-black/50 backdrop-blur-[18px]">
                    <component
                      :is="(viewer.mediaStates.value[getItemKey(item)]?.paused ?? true) ? Play : Pause"
                      class="h-4 w-4 stroke-2"
                      aria-hidden="true"
                    />
                  </span>
                </button>

                <div
                  v-if="isAssetLoading(index, item)"
                  data-testid="vibe-asset-spinner"
                  class="pointer-events-none absolute inset-0 z-[3] grid place-items-center"
                >
                  <span class="inline-flex h-12 w-12 items-center justify-center rounded-full bg-black/45 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.85)] backdrop-blur-[18px]">
                    <LoaderCircle class="h-5 w-5 animate-spin stroke-[1.9] text-[#f7f1ea]/78" aria-hidden="true" />
                  </span>
                </div>

                <template v-if="getAssetErrorKind(item)">
                  <div class="pointer-events-none absolute inset-0 border border-white/8 bg-[radial-gradient(circle,rgba(239,68,68,0.12),transparent_66%)]" />
                  <div
                    data-testid="vibe-asset-error"
                    :data-kind="getAssetErrorKind(item)"
                    class="relative z-[1] grid justify-items-center gap-4"
                  >
                    <TriangleAlert class="h-7 w-7 stroke-[1.9] text-[#f7f1ea]/72" aria-hidden="true" />
                    <p class="m-0 text-[0.82rem] font-bold uppercase tracking-[0.28em] text-[#f7f1ea]/70">
                      {{ getAssetErrorLabel(item) }}
                    </p>
                    <button v-if="viewer.canRetryAsset(getItemKey(item))" type="button" class="pointer-events-auto inline-flex items-center justify-center border border-white/14 bg-black/35 px-4 py-2 text-[0.64rem] font-bold uppercase tracking-[0.22em] text-[#f7f1ea]/82 backdrop-blur-[18px] transition hover:border-white/28 hover:bg-black/50" @click.stop="viewer.retryAsset(getItemKey(item))">
                      Retry
                    </button>
                  </div>
                </template>
              </div>

              <audio
                :key="viewer.getAssetRenderKey(getItemKey(item))"
                :src="getFullscreenMediaSource(index, item)"
                :preload="shouldPreloadSlideAsset(index) ? 'metadata' : 'none'"
                class="pointer-events-none absolute h-px w-px opacity-0"
                :ref="(element) => viewer.registerAudioElement(getItemKey(item), element)"
                @canplay="viewer.onMediaEvent(getItemKey(item), $event)"
                @durationchange="viewer.onMediaEvent(getItemKey(item), $event)"
                @error="viewer.onMediaError(getItemKey(item), item.url)"
                @loadstart="viewer.onMediaEvent(getItemKey(item), $event)"
                @loadedmetadata="viewer.onMediaEvent(getItemKey(item), $event)"
                @pause="viewer.onMediaEvent(getItemKey(item), $event)"
                @play="viewer.onMediaEvent(getItemKey(item), $event)"
                @playing="viewer.onMediaEvent(getItemKey(item), $event)"
                @seeking="viewer.onMediaEvent(getItemKey(item), $event)"
                @seeked="viewer.onMediaEvent(getItemKey(item), $event)"
                @stalled="viewer.onMediaEvent(getItemKey(item), $event)"
                @timeupdate="viewer.onMediaEvent(getItemKey(item), $event)"
                @waiting="viewer.onMediaEvent(getItemKey(item), $event)"
              />
            </div>

            <div
              v-else
              class="relative z-[1] grid w-full max-w-[1100px] justify-items-center gap-6 px-[clamp(2rem,4vw,3rem)] py-[clamp(2rem,4vw,3rem)] text-center"
            >
              <div class="inline-flex min-h-[4.25rem] min-w-[4.25rem] items-center justify-center border border-white/18 bg-white/8 p-4 backdrop-blur-[20px]">
                <slot name="item-icon" :icon="getItemIcon(item.type)" :item="item">
                  <component :is="getItemIcon(item.type)" class="h-6 w-6 stroke-[1.9]" aria-hidden="true" />
                </slot>
              </div>
            </div>
          </article>

          <div
            v-if="fullscreenSlotProps && slots['fullscreen-overlay']"
            class="pointer-events-none absolute inset-0 z-[4]"
          >
            <div class="h-full w-full">
              <slot name="fullscreen-overlay" v-bind="fullscreenSlotProps" />
            </div>
          </div>

          <FullscreenHeader
            v-if="viewer.activeItem.value"
            :current-index="viewer.resolvedActiveIndex.value"
            :pagination-detail="viewer.paginationDetail.value"
            :show-back-to-list="props.showBackToList"
            :show-end-badge="props.showEndBadge && viewer.isAtEnd.value && !viewer.hasNextPage.value && !viewer.loading.value"
            :title="viewer.activeItem.value.title ?? null"
            :total="viewer.items.value.length"
            @back-to-list="emit('back-to-list')"
          >
            <template v-if="showFullscreenHeaderActions && fullscreenSlotProps" #actions>
              <slot
                name="fullscreen-header-actions"
                v-bind="fullscreenSlotProps"
              />
            </template>
          </FullscreenHeader>

          <FullscreenMediaBar
            v-if="showMediaBar"
            :current-time="viewer.activeMediaState.value.currentTime"
            :current-time-label="viewer.formatPlaybackTime(viewer.activeMediaState.value.currentTime)"
            :duration="viewer.activeMediaDuration.value"
            :duration-label="viewer.formatPlaybackTime(viewer.activeMediaDuration.value)"
            :progress="viewer.activeMediaProgress.value"
            @seek-input="viewer.onMediaSeekInput"
          />

          <div
            v-if="fullscreenStatusProps"
            class="absolute left-1/2 z-[4] -translate-x-1/2"
            :class="mediaStatusOffsetClass"
          >
            <slot
              v-if="showCustomFullscreenStatus"
              name="fullscreen-status"
              v-bind="fullscreenStatusProps"
            />
            <div
              v-else
              class="inline-flex w-auto items-center border border-white/14 bg-black/40 px-5 py-3 text-[0.75rem] font-bold uppercase tracking-[0.18em] text-[#f7f1ea]/74 backdrop-blur-[18px] max-[720px]:w-[calc(100%-2.5rem)] max-[720px]:justify-center"
              :class="fullscreenStatusProps.kind === 'end' ? 'border-amber-300/35 text-amber-200' : ''"
            >
              {{ fullscreenStatusProps.message }}
            </div>
          </div>
        </div>
      </div>

      <Transition
        enter-active-class="transform-gpu transition-all duration-320 ease-out"
        enter-from-class="translate-x-full opacity-0"
        enter-to-class="translate-x-0 opacity-100"
        leave-active-class="transform-gpu transition-all duration-260 ease-in"
        leave-from-class="translate-x-0 opacity-100"
        leave-to-class="translate-x-full opacity-0"
      >
        <aside
          v-if="showFullscreenAsideAsColumn && fullscreenSlotProps"
          data-testid="vibe-fullscreen-aside"
          class="h-full min-h-0 overflow-hidden border-l border-white/10 bg-black/45 backdrop-blur-[18px]"
        >
          <div class="h-full min-h-0 overflow-y-auto overscroll-y-contain">
            <slot name="fullscreen-aside" v-bind="fullscreenSlotProps" />
          </div>
        </aside>
      </Transition>
    </div>

    <Transition
      enter-active-class="transform-gpu transition-all duration-320 ease-out"
      enter-from-class="translate-x-full opacity-0"
      enter-to-class="translate-x-0 opacity-100"
      leave-active-class="transform-gpu transition-all duration-260 ease-in"
      leave-from-class="translate-x-0 opacity-100"
      leave-to-class="translate-x-full opacity-0"
    >
      <aside
        v-if="showFullscreenAsideAsDrawer && fullscreenSlotProps"
        data-testid="vibe-fullscreen-aside"
        class="absolute inset-y-0 right-0 z-[6] w-full max-w-[22rem] overflow-hidden border-l border-white/10 bg-black/82 backdrop-blur-[18px]"
      >
        <div class="h-full min-h-0 overflow-y-auto overscroll-y-contain">
          <slot name="fullscreen-aside" v-bind="fullscreenSlotProps" />
        </div>
      </aside>
    </Transition>
  </div>
</template>
