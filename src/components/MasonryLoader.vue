<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { MasonryItemBase } from '@/masonry/types'

type Props = {
  item: MasonryItemBase
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'success', item: MasonryItemBase): void
  (e: 'error', payload: { item: MasonryItemBase; error: unknown }): void
}>()

const rootEl = ref<HTMLElement | null>(null)
const shouldRenderMedia = ref(false)
const isLoaded = ref(false)
const isError = ref(false)
const loadAttempt = ref(0)

const aspectRatioStyle = computed(() => {
  const w = props.item?.width
  const h = props.item?.height
  return { aspectRatio: `${w} / ${h}` }
})

const isImage = computed(() => props.item?.type === 'image')

let io: IntersectionObserver | null = null

function startIfNeeded() {
  if (shouldRenderMedia.value) return
  shouldRenderMedia.value = true
  isLoaded.value = false
  isError.value = false
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
})

onUnmounted(() => {
  io?.disconnect()
  io = null
})

function onSuccess() {
  if (isLoaded.value) return
  isLoaded.value = true
  isError.value = false
  emit('success', props.item)
}

function onError(err: unknown) {
  if (isError.value) return
  isLoaded.value = false
  isError.value = true
  emit('error', { item: props.item, error: err })
}

function retry() {
  // Keep the intersection gating decision: retry only after we started.
  if (!shouldRenderMedia.value) return
  isLoaded.value = false
  isError.value = false
  loadAttempt.value += 1
}
</script>

<template>
  <div ref="rootEl" class="relative bg-slate-100" :style="aspectRatioStyle">
    <div
      v-if="shouldRenderMedia && !isLoaded && !isError"
      data-testid="masonry-loader-spinner"
      class="absolute inset-0 flex items-center justify-center"
    >
      <svg
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
      class="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3"
    >
      <p class="text-center text-xs font-medium text-red-700">Failed to load</p>
      <button
        type="button"
        data-testid="masonry-loader-retry"
        class="inline-flex items-center rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700"
        @click="retry"
      >
        Retry
      </button>
    </div>

    <img
      v-if="shouldRenderMedia && isImage && !isError"
      :key="props.item.id + ':img:' + loadAttempt"
      class="h-full w-full object-cover"
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
      class="h-full w-full object-cover"
      :poster="props.item.preview as string"
      controls
      preload="metadata"
      @loadedmetadata="onSuccess"
      @error="onError($event)"
    >
      <source :src="props.item.original as string" type="video/mp4" />
    </video>
  </div>
</template>
