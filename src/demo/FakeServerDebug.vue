<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

import {
  createFakeMediaServer,
  type FakeMediaItem,
  type FakeMediaPageResponse,
} from '@/demo/fakeServer'

const PAGE_SIZES = [4, 8, 12]

const server = createFakeMediaServer({
  minDelayMs: 120,
  maxDelayMs: 260,
})

const page = ref(1)
const pageSize = ref(8)
const response = ref<FakeMediaPageResponse | null>(null)
const isLoading = ref(false)
const errorMessage = ref<string | null>(null)

const totalPages = computed(() => response.value?.totalPages ?? 1)
const totalItems = computed(() => response.value?.totalItems ?? 0)
const nextPage = computed(() => response.value?.nextPage ?? null)
const canGoPrevious = computed(() => page.value > 1 && !isLoading.value)
const canGoNext = computed(() => page.value < totalPages.value && !isLoading.value)

watch(pageSize, () => {
  page.value = 1
})

watch([page, pageSize], async () => {
  await loadPage()
})

onMounted(async () => {
  await loadPage()
})

async function loadPage() {
  isLoading.value = true
  errorMessage.value = null

  try {
    response.value = await server.fetchPage({
      page: page.value,
      pageSize: pageSize.value,
    })
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Unknown server error.'
  }
  finally {
    isLoading.value = false
  }
}

function goToPreviousPage() {
  if (canGoPrevious.value) {
    page.value -= 1
  }
}

function goToNextPage() {
  if (canGoNext.value) {
    page.value += 1
  }
}

function isVisualItem(item: FakeMediaItem): item is FakeMediaItem & { width: number; height: number } {
  return (
    (item.type === 'image' || item.type === 'video')
    && typeof item.width === 'number'
    && typeof item.height === 'number'
  )
}

function hasPreviewDimensions(item: FakeMediaItem) {
  return Boolean(item.preview?.width && item.preview.height)
}

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`
  }

  const units = ['KB', 'MB', 'GB']
  let size = sizeBytes / 1024
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }

  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[unitIndex]}`
}

function formatDuration(durationMs: number | undefined) {
  if (!durationMs) {
    return 'n/a'
  }

  const totalSeconds = Math.round(durationMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function dimensionSource(item: FakeMediaItem) {
  return hasPreviewDimensions(item) ? 'preview' : 'original'
}

function cardTone(item: FakeMediaItem) {
  switch (item.type) {
    case 'image':
      return 'border-amber-300/70 bg-amber-50/80'
    case 'video':
      return 'border-sky-300/70 bg-sky-50/80'
    case 'audio':
      return 'border-emerald-300/70 bg-emerald-50/80'
    case 'document':
      return 'border-violet-300/70 bg-violet-50/80'
    case 'archive':
      return 'border-rose-300/70 bg-rose-50/80'
    default:
      return 'border-stone-300/70 bg-stone-50/80'
  }
}
</script>

<template>
  <section class="border border-white/70 bg-white/70 p-5 shadow-[0_30px_90px_-48px_rgba(31,26,22,0.45)] backdrop-blur sm:p-6">
    <div class="flex flex-col gap-6">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-[0.3em] text-stone-500">Debug page</p>
          <h2 class="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
            Fake paginated media server
          </h2>
          <p class="max-w-3xl text-sm leading-7 text-stone-600 sm:text-base">
            Browse the response shape, step through pages, and confirm that image and video items expose
            `width` and `height` with preview dimensions preferred over original dimensions.
          </p>
        </div>

        <div class="grid gap-3 sm:grid-cols-[auto_auto_auto] sm:items-end">
          <label class="grid gap-2 text-sm text-stone-600">
            <span class="font-medium">Page size</span>
            <select
              v-model="pageSize"
              class="border border-stone-300 bg-white px-4 py-3 text-stone-900 shadow-sm outline-none transition focus:border-stone-500"
            >
              <option v-for="size in PAGE_SIZES" :key="size" :value="size">
                {{ size }} items
              </option>
            </select>
          </label>

          <div class="flex gap-2">
            <button
              type="button"
              class="border border-stone-300 bg-white px-4 py-3 text-sm font-medium text-stone-900 transition hover:border-stone-400 disabled:cursor-not-allowed disabled:opacity-45"
              :disabled="!canGoPrevious"
              @click="goToPreviousPage"
            >
              Previous
            </button>
            <button
              type="button"
              class="border border-stone-900 bg-stone-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-45"
              :disabled="!canGoNext"
              @click="goToNextPage"
            >
              Next
            </button>
          </div>

          <button
            type="button"
            class="border border-amber-400/60 bg-amber-300/50 px-4 py-3 text-sm font-medium text-stone-950 transition hover:bg-amber-300/70 disabled:cursor-not-allowed disabled:opacity-45"
            :disabled="isLoading"
            @click="loadPage"
          >
            {{ isLoading ? 'Loading…' : 'Reload page' }}
          </button>
        </div>
      </div>

      <div class="grid gap-3 md:grid-cols-4">
        <div class="border border-black/8 bg-black/[0.03] p-4">
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">Current page</p>
          <p class="mt-2 text-2xl font-semibold text-stone-950">{{ page }}</p>
        </div>
        <div class="border border-black/8 bg-black/[0.03] p-4">
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">Total pages</p>
          <p class="mt-2 text-2xl font-semibold text-stone-950">{{ totalPages }}</p>
        </div>
        <div class="border border-black/8 bg-black/[0.03] p-4">
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">Total items</p>
          <p class="mt-2 text-2xl font-semibold text-stone-950">{{ totalItems }}</p>
        </div>
        <div class="border border-black/8 bg-black/[0.03] p-4">
          <p class="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">Next page token</p>
          <p class="mt-2 text-2xl font-semibold text-stone-950">{{ nextPage ?? 'null' }}</p>
        </div>
      </div>

      <p v-if="errorMessage" class="border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700">
        {{ errorMessage }}
      </p>

      <div class="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)]">
        <div class="grid gap-4">
          <article
            v-for="item in response?.items ?? []"
            :key="item.id"
            class="overflow-hidden border p-4 shadow-[0_20px_50px_-40px_rgba(31,26,22,0.35)]"
            :class="cardTone(item)"
          >
            <div class="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
              <div
                class="relative overflow-hidden border border-black/8 bg-black/[0.04] aspect-[4/3]"
              >
                <img
                  v-if="item.type === 'image' && item.preview"
                  :src="item.preview.url"
                  :alt="item.title"
                  class="h-full w-full object-cover"
                />
                <video
                  v-else-if="item.type === 'video' && item.preview"
                  class="h-full w-full object-cover"
                  autoplay
                  muted
                  loop
                  playsinline
                  preload="metadata"
                >
                  <source :src="item.preview.url" :type="item.preview.mimeType || item.mimeType" />
                </video>
                <div
                  v-else
                  class="flex h-full items-center justify-center px-4 text-center text-sm font-medium uppercase tracking-[0.24em] text-stone-500"
                >
                  {{ item.preview ? 'Preview asset' : item.type }}
                </div>

                <span
                  class="absolute left-3 top-3 bg-black/75 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white"
                >
                  {{ item.type }}
                </span>
              </div>

              <div class="grid gap-3">
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 class="text-xl font-semibold tracking-tight text-stone-950">{{ item.title }}</h3>
                    <p class="mt-1 text-sm text-stone-600">{{ item.id }}</p>
                  </div>
                  <span class="border border-black/8 bg-white/80 px-3 py-1 text-xs font-medium text-stone-700">
                    {{ item.extension }}
                  </span>
                </div>

                <div class="flex flex-wrap gap-2 text-xs font-medium text-stone-700">
                  <span class="bg-white/75 px-3 py-1">{{ item.mimeType }}</span>
                  <span class="bg-white/75 px-3 py-1">{{ formatFileSize(item.sizeBytes) }}</span>
                  <span class="bg-white/75 px-3 py-1">{{ formatDate(item.createdAt) }}</span>
                  <span class="bg-white/75 px-3 py-1">Duration {{ formatDuration(item.durationMs) }}</span>
                </div>

                <div class="grid gap-3 sm:grid-cols-2">
                  <div class="border border-black/8 bg-white/70 p-3">
                    <p class="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Original</p>
                    <p class="mt-2 break-all text-sm leading-6 text-stone-700">{{ item.original.url }}</p>
                  </div>

                  <div class="border border-black/8 bg-white/70 p-3">
                    <p class="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Preview</p>
                    <p class="mt-2 break-all text-sm leading-6 text-stone-700">
                      {{ item.preview?.url ?? 'No preview asset' }}
                    </p>
                  </div>
                </div>

                <div
                  class="grid gap-3"
                  :class="isVisualItem(item) ? 'sm:grid-cols-3' : 'sm:grid-cols-2'"
                >
                  <div class="border border-black/8 bg-white/70 p-3">
                    <p class="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Resolved dimensions</p>
                    <p class="mt-2 text-sm text-stone-800">
                      {{ isVisualItem(item) ? `${item.width} × ${item.height}` : 'n/a' }}
                    </p>
                  </div>

                  <div class="border border-black/8 bg-white/70 p-3">
                    <p class="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Dimension source</p>
                    <p class="mt-2 text-sm text-stone-800">
                      {{ isVisualItem(item) ? dimensionSource(item) : 'n/a' }}
                    </p>
                  </div>

                  <div
                    v-if="isVisualItem(item)"
                    class="border border-black/8 bg-white/70 p-3"
                  >
                    <p class="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Aspect ratio</p>
                    <p class="mt-2 text-sm text-stone-800">{{ (item.width / item.height).toFixed(2) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </div>

        <aside class="grid gap-4">
          <div class="border border-black/8 bg-stone-950 p-4 text-stone-100 shadow-[0_24px_60px_-40px_rgba(31,26,22,0.6)]">
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-stone-400">Response snapshot</p>
            <pre class="mt-3 overflow-auto text-xs leading-6 text-stone-200">{{ JSON.stringify(response, null, 2) }}</pre>
          </div>

          <div class="border border-black/8 bg-white/80 p-4">
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">What to verify</p>
            <ul class="mt-3 grid gap-2 text-sm leading-6 text-stone-700">
              <li>Image and video items expose top-level `width` and `height`.</li>
              <li>Preview dimensions win when preview width and height are both present.</li>
              <li>Video items expose both a short preview clip and an original media URL.</li>
              <li>Audio items expose preview and original with the same source URL.</li>
              <li>Non-visual items still carry preview/original assets but no resolved dimensions.</li>
              <li>`nextPage` becomes `null` on the last page.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  </section>
</template>
