<script setup lang="ts">
import { computed, defineComponent, onMounted, onUnmounted, ref } from 'vue'
import { watch } from 'vue'
import type { MasonryItemBase } from '@/masonry/types'
import type {
  MasonryItemErrorSlotProps,
  MasonryItemLoaderSlotProps,
} from '@/components/masonryItemRegistry'
import type { Slot } from 'vue'

type Props = {
  item: MasonryItemBase
  remove?: () => void
  loaderSlotFn?: Slot<MasonryItemLoaderSlotProps>
  errorSlotFn?: Slot<MasonryItemErrorSlotProps>
  timeoutMs?: number
  hovered?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  timeoutMs: 15_000,
  hovered: false,
})

const emit = defineEmits<{
  (e: 'success', item: MasonryItemBase): void
  (e: 'error', payload: { item: MasonryItemBase; error: unknown }): void
}>()

const SlotRenderer = defineComponent({
  name: 'SlotRenderer',
  props: {
    slotFn: {
      type: Function,
      required: false,
    },
    slotProps: {
      type: Object,
      required: true,
    },
  },
  setup(props) {
    return () => {
      const fn = props.slotFn as ((p: unknown) => unknown) | undefined
      return fn ? (fn(props.slotProps) as unknown) : null
    }
  },
})

const rootEl = ref<HTMLElement | null>(null)
const videoEl = ref<HTMLVideoElement | null>(null)
const shouldRenderMedia = ref(false)
const isLoaded = ref(false)
const isError = ref(false)
const loadAttempt = ref(0)
const lastError = ref<unknown>(null)

const isVideo = computed(() => props.item?.type === 'video')
const videoPoster = computed(() => {
  if (!isVideo.value) return undefined
  const preview = props.item?.preview
  const original = props.item?.original
  if (typeof preview !== 'string' || !preview) return undefined
  if (typeof original === 'string' && preview === original) return undefined
  if (/\.(mp4|webm)(\?|#|$)/i.test(preview)) return undefined
  return preview
})

const isVideoInView = ref(false)
const isHovered = computed(() => Boolean(props.hovered))
const videoDuration = ref(0)
const videoCurrentTime = ref(0)

function remove() {
  props.remove?.()
}

const aspectRatioStyle = computed(() => {
  const w = props.item?.width
  const h = props.item?.height
  return { aspectRatio: `${w} / ${h}` }
})

const isImage = computed(() => props.item?.type === 'image')

let io: IntersectionObserver | null = null
let playbackIo: IntersectionObserver | null = null
let loadTimeoutId: number | null = null

function clearLoadTimeout() {
  if (loadTimeoutId == null) return
  window.clearTimeout(loadTimeoutId)
  loadTimeoutId = null
}

function scheduleLoadTimeout() {
  clearLoadTimeout()
  const ms = typeof props.timeoutMs === 'number' && Number.isFinite(props.timeoutMs) ? props.timeoutMs : 0
  if (ms <= 0) return

  loadTimeoutId = window.setTimeout(() => {
    if (!shouldRenderMedia.value) return
    if (isLoaded.value || isError.value) return
    onError(new Error('timeout'))
  }, ms)
}

function startIfNeeded() {
  if (shouldRenderMedia.value) return
  shouldRenderMedia.value = true
  isLoaded.value = false
  isError.value = false
  scheduleLoadTimeout()
}

function syncVideoStateFromEl(el: HTMLVideoElement) {
  videoDuration.value = Number.isFinite(el.duration) ? el.duration : 0
  videoCurrentTime.value = Number.isFinite(el.currentTime) ? el.currentTime : 0
}

async function playVideoForHover() {
  if (!isVideo.value) return
  if (!isHovered.value) return
  if (!shouldRenderMedia.value) return
  if (!isLoaded.value) return
  if (!isVideoInView.value) return

  const el = videoEl.value
  if (!el) return

  try {
    // Keep videos muted; we don't expose volume controls.
    el.muted = true
    await el.play()
  } catch {
    // Ignore playback failures (browser policy, etc.).
  }
}

function pauseVideoForHover() {
  const el = videoEl.value
  if (!el) return
  if (el.paused) return
  el.pause()
}

function pauseVideoForViewport() {
  const el = videoEl.value
  if (!el) return
  if (el.paused) return
  el.pause()
}

watch(
  () => props.hovered,
  (next) => {
    if (next) {
      startIfNeeded()
      void playVideoForHover()
      return
    }

    pauseVideoForHover()
  }
)

function onSeekInput(e: Event) {
  const el = videoEl.value
  if (!el) return
  const raw = (e.target as HTMLInputElement | null)?.value
  const next = raw == null ? NaN : Number(raw)
  if (!Number.isFinite(next)) return
  el.currentTime = Math.max(0, Math.min(next, Number.isFinite(el.duration) ? el.duration : next))
  syncVideoStateFromEl(el)
}

onMounted(() => {
  if (typeof IntersectionObserver === 'undefined') {
    startIfNeeded()
    return
  }

  io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        if ((entry.intersectionRatio ?? 0) < 0.5) continue
        startIfNeeded()
        io?.disconnect()
        io = null
        return
      }
    },
    { threshold: [0, 0.5, 1] }
  )

  if (rootEl.value) io.observe(rootEl.value)

  if (isVideo.value && rootEl.value) {
    const scrollRoot = rootEl.value.closest<HTMLElement>('[data-testid="items-scroll-container"]')

    playbackIo = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const ratio = entry.intersectionRatio ?? 0
          const nextInView = Boolean(entry.isIntersecting) && ratio >= 0.5
          isVideoInView.value = nextInView
          if (!nextInView) {
            pauseVideoForViewport()
          } else if (isHovered.value) {
            void playVideoForHover()
          }
        }
      },
      {
        root: scrollRoot ?? undefined,
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    )

    playbackIo.observe(rootEl.value)
  }
})

onUnmounted(() => {
  io?.disconnect()
  io = null
  playbackIo?.disconnect()
  playbackIo = null
  clearLoadTimeout()
})

function onSuccess() {
  if (isLoaded.value) return
  isLoaded.value = true
  isError.value = false
  lastError.value = null
  clearLoadTimeout()
  emit('success', props.item)
}

function onError(err: unknown) {
  if (isError.value) return
  isLoaded.value = false
  isError.value = true
  lastError.value = err
  clearLoadTimeout()
  emit('error', { item: props.item, error: err })
}

function retry() {
  // Keep the intersection gating decision: retry only after we started.
  if (!shouldRenderMedia.value) return
  isLoaded.value = false
  isError.value = false
  lastError.value = null
  loadAttempt.value += 1
  scheduleLoadTimeout()
}

function handleVideoLoadedMetadata() {
  onSuccess()
  const el = videoEl.value
  if (el) syncVideoStateFromEl(el)
  void playVideoForHover()
}

function handleVideoTimeUpdate() {
  const el = videoEl.value
  if (!el) return
  syncVideoStateFromEl(el)
}
</script>

<template>
  <div
    ref="rootEl"
    class="relative bg-slate-100"
    :style="aspectRatioStyle"
  >
    <div
      v-if="shouldRenderMedia && !isLoaded && !isError"
      data-testid="masonry-loader-spinner"
      class="absolute inset-0 z-10 flex items-center justify-center"
    >
      <SlotRenderer
        v-if="props.loaderSlotFn"
        :slot-fn="props.loaderSlotFn"
        :slot-props="({ item: props.item, remove } satisfies MasonryItemLoaderSlotProps)"
      />
      <svg
        v-else
        class="h-5 w-5 animate-spin text-slate-500"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          fill="none"
          stroke="currentColor"
          stroke-width="4"
        />
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
        />
      </svg>
    </div>

    <div
      v-else-if="shouldRenderMedia && isError"
      data-testid="masonry-loader-error"
      class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 p-3"
    >
      <SlotRenderer
        v-if="props.errorSlotFn"
        :slot-fn="props.errorSlotFn"
        :slot-props="({ item: props.item, remove, error: lastError, retry } satisfies MasonryItemErrorSlotProps)"
      />
      <template v-else>
        <p class="text-center text-xs font-medium text-red-700">Failed to load</p>
        <button
          type="button"
          data-testid="masonry-loader-retry"
          class="inline-flex items-center rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700"
          @click="retry"
        >
          Retry
        </button>
      </template>
    </div>

    <img
      v-if="shouldRenderMedia && isImage && !isError"
      :key="props.item.id + ':img:' + loadAttempt"
      :class="[
        'h-full w-full object-cover transition-opacity duration-300',
        isLoaded ? 'opacity-100' : 'opacity-0',
      ]"
      :src="props.item.preview as string"
      :width="props.item.width"
      :height="props.item.height"
      loading="lazy"
      :alt="props.item.id"
      @load="onSuccess"
      @error="onError($event)"
    />

    <video
      v-else-if="shouldRenderMedia && !isError"
      :key="props.item.id + ':vid:' + loadAttempt"
      :class="[
        'h-full w-full object-cover transition-opacity duration-300',
        isLoaded ? 'opacity-100' : 'opacity-0',
      ]"
      :poster="videoPoster"
      ref="videoEl"
      playsinline
      loop
      preload="metadata"
      @loadedmetadata="handleVideoLoadedMetadata"
      @timeupdate="handleVideoTimeUpdate"
      @durationchange="handleVideoTimeUpdate"
      @loadeddata="handleVideoTimeUpdate"
      @error="onError($event)"
    >
      <source :src="props.item.original as string" type="video/mp4" />
    </video>

    <div
      v-if="shouldRenderMedia && isVideo && !isError"
      class="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-2 pb-2 opacity-0 transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100"
    >
      <input
        type="range"
        class="h-1 w-full cursor-pointer appearance-none bg-transparent"
        :min="0"
        :max="videoDuration || 0"
        step="0.1"
        :value="videoCurrentTime"
        aria-label="Seek"
        @input="onSeekInput"
      />
    </div>
  </div>
</template>
