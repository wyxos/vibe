<script setup lang="ts">
import { computed, defineComponent, onMounted, onUnmounted, ref, watch } from 'vue'
import MasonryVideoControls from '@/components/MasonryVideoControls.vue'
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
  hovered?: boolean
}

const props = withDefaults(defineProps<Props>(), {
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
const imgEl = ref<HTMLImageElement | null>(null)
const videoEl = ref<HTMLVideoElement | null>(null)
const shouldRenderMedia = ref(false)
const isLoaded = ref(false)
const isError = ref(false)
const lastError = ref<unknown>(null)

const isVideo = computed(() => props.item?.type === 'video')
const mediaErrorLabel = computed(() => (isVideo.value ? 'video' : 'image'))
const videoPoster = computed(() => {
  if (!isVideo.value) return undefined
  const preview = props.item?.preview
  const original = props.item?.original
  if (typeof preview !== 'string' || !preview) return undefined
  if (typeof original === 'string' && preview === original) return undefined
  if (/\.(mp4|webm)(\?|#|$)/i.test(preview)) return undefined
  if (!/\.(png|jpe?g|gif|webp)(\?|#|$)/i.test(preview)) return undefined
  return preview
})
const videoSrc = computed(() => {
  if (!isVideo.value) return undefined
  const preview = props.item?.preview
  if (typeof preview === 'string' && preview && !/\.(png|jpe?g|gif|webp)(\?|#|$)/i.test(preview)) {
    return preview
  }
  const original = props.item?.original
  if (typeof original === 'string' && original) return original
  return undefined
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

// Anything that isn't explicitly a video should be treated as an image-like item.
// This allows consumers to pass types like "audio" or "file" while still rendering
// their `preview` as an <img> (and avoids falling back to <video> for unknown types).
const isImage = computed(() => !isVideo.value)

function getErrorMessage(err: unknown, mediaLabel: string): string {
  const fallback = `Failed to load ${mediaLabel}.`

  if (typeof err === 'string') {
    const next = err.trim()
    return next || fallback
  }

  if (err instanceof Error) {
    const next = err.message?.trim()
    return next || fallback
  }

  if (typeof err === 'object' && err !== null) {
    if ('message' in err && typeof err.message === 'string') {
      const next = err.message.trim()
      if (next) return next
    }

    if (err instanceof Event) {
      return fallback
    }
  }

  if (typeof err === 'number' || typeof err === 'boolean' || typeof err === 'bigint') {
    return String(err)
  }

  return fallback
}

const errorMessage = computed(() => getErrorMessage(lastError.value, mediaErrorLabel.value))

let io: IntersectionObserver | null = null
let playbackIo: IntersectionObserver | null = null

function startIfNeeded() {
  if (shouldRenderMedia.value) return
  shouldRenderMedia.value = true
  isLoaded.value = false
  isError.value = false
  lastError.value = null
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

function onSeekInput(next: number) {
  const el = videoEl.value
  if (!el) return
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
})

function onSuccess() {
  if (isLoaded.value) return
  isLoaded.value = true
  isError.value = false
  lastError.value = null
  emit('success', props.item)
}

function onError(err: unknown) {
  if (isError.value) return
  isLoaded.value = false
  isError.value = true
  lastError.value = err
  emit('error', { item: props.item, error: err })
}

function markLoadedIfAlreadyReady(): void {
  if (!shouldRenderMedia.value) return
  if (isLoaded.value) return
  if (isError.value) return

  if (isImage.value) {
    const el = imgEl.value
    if (!el) return
    if (!el.complete) return
    if (el.naturalWidth > 0) {
      onSuccess()
    }
    return
  }

  if (isVideo.value) {
    const el = videoEl.value
    // Some browsers can have metadata ready before the event listener is attached.
    if (el && (el.readyState ?? 0) >= 1) {
      handleVideoLoadedMetadata()
    }
  }
}

watch(
  [shouldRenderMedia, () => props.item.preview, () => videoSrc.value],
  () => {
    if (!shouldRenderMedia.value) return
    // If the asset is cached, the load/metadata event can be missed; re-check post-render.
    void Promise.resolve().then(markLoadedIfAlreadyReady)
  },
  { flush: 'post' }
)

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
    class="vibe-loader"
    :style="aspectRatioStyle"
  >
    <div
      v-if="shouldRenderMedia && !isLoaded && !isError"
      data-testid="masonry-loader-spinner"
      class="vibe-loader__pending"
    >
      <div class="vibe-loader__pending-inner">
        <SlotRenderer
          v-if="props.loaderSlotFn"
          :slot-fn="props.loaderSlotFn"
          :slot-props="({ item: props.item, remove } satisfies MasonryItemLoaderSlotProps)"
        />
        <svg
          v-else
          class="vibe-spinner vibe-spinner--lg"
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
    </div>

    <div
      v-else-if="shouldRenderMedia && isError"
      data-testid="masonry-loader-error"
      class="vibe-loader__error"
    >
      <div class="vibe-loader__error-inner">
        <SlotRenderer
          v-if="props.errorSlotFn"
          :slot-fn="props.errorSlotFn"
          :slot-props="({ item: props.item, remove, error: lastError } satisfies MasonryItemErrorSlotProps)"
        />
        <template v-else>
          <p>Error: {{ errorMessage }}</p>
        </template>
      </div>
    </div>

    <img
      v-if="shouldRenderMedia && isImage && !isError"
      :key="props.item.id + ':img'"
      ref="imgEl"
      :class="[
        'vibe-loader__media',
        isLoaded ? 'vibe-loader__media--loaded' : '',
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
      :key="props.item.id + ':vid'"
      :class="[
        'vibe-loader__media',
        isLoaded ? 'vibe-loader__media--loaded' : '',
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
      <source
        :src="videoSrc"
        type="video/mp4"
        @error="onError($event)"
      />
    </video>

    <div
      v-if="shouldRenderMedia && isVideo && !isError"
      class="vibe-loader__controls"
    >
      <MasonryVideoControls
        :duration="videoDuration"
        :current-time="videoCurrentTime"
        @seek="onSeekInput"
      />
    </div>
  </div>
</template>
