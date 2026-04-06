<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

import { getItemIcon, getItemLabel } from '@/components/vibe-root/media'
import {
  createFakeMediaServer,
  type FakeMediaItem,
  type FakeMediaPageResponse,
} from '@/demo/fakeServer'

const PAGE_SIZE = 25

const server = createFakeMediaServer({
  minDelayMs: 120,
  maxDelayMs: 260,
})

const page = ref(1)
const response = ref<FakeMediaPageResponse | null>(null)
const isLoading = ref(false)
const errorMessage = ref<string | null>(null)

const totalPages = computed(() => response.value?.totalPages ?? 1)
const totalItems = computed(() => response.value?.totalItems ?? 0)
const nextPage = computed(() => response.value?.nextPage ?? null)
const previousPage = computed(() => response.value?.previousPage ?? null)
const canGoPrevious = computed(() => page.value > 1 && !isLoading.value)
const canGoNext = computed(() => page.value < totalPages.value && !isLoading.value)
const vibeRootContractSnapshot = computed(() => {
  if (!response.value) {
    return null
  }

  return {
    items: response.value.items,
    nextPage: response.value.nextPage,
    previousPage: response.value.previousPage,
  }
})

watch(page, async () => {
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
      pageSize: PAGE_SIZE,
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

function isVisualItem(item: FakeMediaItem) {
  return item.type === 'image' || item.type === 'video'
}

function formatDimensions(width?: number, height?: number) {
  if (!width || !height) {
    return 'n/a'
  }

  return `${width} × ${height}`
}

function cardTone(item: FakeMediaItem) {
  switch (item.type) {
    case 'image':
      return 'border-amber-300/26 bg-amber-300/[0.045]'
    case 'video':
      return 'border-sky-300/26 bg-sky-300/[0.045]'
    case 'audio':
      return 'border-emerald-300/26 bg-emerald-300/[0.045]'
    case 'document':
      return 'border-violet-300/26 bg-violet-300/[0.045]'
    case 'archive':
      return 'border-rose-300/26 bg-rose-300/[0.045]'
    default:
      return 'border-white/14 bg-white/[0.04]'
  }
}
</script>

<template>
  <section class="h-full min-h-full overflow-auto bg-[#05060a] text-[#f7f1ea]">
    <div class="mx-auto flex min-h-full w-full max-w-[1600px] flex-col gap-5 px-5 py-5 sm:px-6">
      <div class="grid gap-5 border border-white/12 bg-black/20 px-5 py-5 shadow-[0_28px_80px_-50px_rgba(0,0,0,0.88)] backdrop-blur-[18px] xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
        <div class="space-y-3">
          <p class="text-[0.68rem] font-bold uppercase tracking-[0.32em] text-[#f7f1ea]/46">Workspace debug</p>
          <h1 class="text-[clamp(2rem,4vw,3.35rem)] font-semibold leading-[0.94] tracking-[-0.05em]">
            Fake paginated media server
          </h1>
          <p class="max-w-3xl text-sm leading-7 text-[#f7f1ea]/64 sm:text-[0.98rem]">
            Inspect the simpler viewer contract and verify that the fake server only requires `id`, `type`,
            optional `title`, the main `url`, main dimensions, and an optional preview object.
          </p>
        </div>

        <div class="grid gap-3 sm:grid-cols-[auto_auto] xl:justify-items-end">
          <div class="flex gap-2">
            <button
              type="button"
              class="border border-white/14 bg-black/35 px-4 py-3 text-[0.74rem] font-bold uppercase tracking-[0.2em] text-[#f7f1ea]/76 transition hover:border-white/28 hover:bg-black/48 disabled:cursor-not-allowed disabled:opacity-40"
              :disabled="!canGoPrevious"
              @click="goToPreviousPage"
            >
              Previous
            </button>
            <button
              type="button"
              class="border border-white/14 bg-white/8 px-4 py-3 text-[0.74rem] font-bold uppercase tracking-[0.2em] text-[#f7f1ea] transition hover:border-white/28 hover:bg-white/12 disabled:cursor-not-allowed disabled:opacity-40"
              :disabled="!canGoNext"
              @click="goToNextPage"
            >
              Next
            </button>
          </div>

          <button
            type="button"
            class="border border-amber-300/28 bg-amber-300/[0.09] px-4 py-3 text-[0.74rem] font-bold uppercase tracking-[0.2em] text-amber-100 transition hover:bg-amber-300/[0.14] disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="isLoading"
            @click="loadPage"
          >
            {{ isLoading ? 'Loading…' : 'Reload page' }}
          </button>
        </div>
      </div>

      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <div class="border border-white/10 bg-black/20 px-4 py-4">
          <p class="text-[0.66rem] font-bold uppercase tracking-[0.28em] text-[#f7f1ea]/46">Current page</p>
          <p data-testid="fake-server-current-page" class="mt-2 text-[1.8rem] font-semibold tracking-[-0.04em] text-[#f7f1ea]">{{ page }}</p>
        </div>
        <div class="border border-white/10 bg-black/20 px-4 py-4">
          <p class="text-[0.66rem] font-bold uppercase tracking-[0.28em] text-[#f7f1ea]/46">Page size</p>
          <p data-testid="fake-server-page-size" class="mt-2 text-[1.8rem] font-semibold tracking-[-0.04em] text-[#f7f1ea]">{{ PAGE_SIZE }}</p>
        </div>
        <div class="border border-white/10 bg-black/20 px-4 py-4">
          <p class="text-[0.66rem] font-bold uppercase tracking-[0.28em] text-[#f7f1ea]/46">Total pages</p>
          <p data-testid="fake-server-total-pages" class="mt-2 text-[1.8rem] font-semibold tracking-[-0.04em] text-[#f7f1ea]">{{ totalPages }}</p>
        </div>
        <div class="border border-white/10 bg-black/20 px-4 py-4">
          <p class="text-[0.66rem] font-bold uppercase tracking-[0.28em] text-[#f7f1ea]/46">Total items</p>
          <p data-testid="fake-server-total-items" class="mt-2 text-[1.8rem] font-semibold tracking-[-0.04em] text-[#f7f1ea]">{{ totalItems }}</p>
        </div>
        <div class="border border-white/10 bg-black/20 px-4 py-4">
          <p class="text-[0.66rem] font-bold uppercase tracking-[0.28em] text-[#f7f1ea]/46">Previous page</p>
          <p class="mt-2 text-[1.8rem] font-semibold tracking-[-0.04em] text-[#f7f1ea]">{{ previousPage ?? 'null' }}</p>
        </div>
        <div class="border border-white/10 bg-black/20 px-4 py-4">
          <p class="text-[0.66rem] font-bold uppercase tracking-[0.28em] text-[#f7f1ea]/46">Next page</p>
          <p data-testid="fake-server-next-page" class="mt-2 text-[1.8rem] font-semibold tracking-[-0.04em] text-[#f7f1ea]">{{ nextPage ?? 'null' }}</p>
        </div>
      </div>

      <p
        v-if="errorMessage"
        class="border border-rose-300/28 bg-rose-300/[0.1] px-4 py-3 text-sm text-rose-100"
      >
        {{ errorMessage }}
      </p>

      <div class="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.82fr)]">
        <div class="grid gap-4">
          <article
            v-for="item in response?.items ?? []"
            :key="item.id"
            class="overflow-hidden border p-4 shadow-[0_20px_60px_-48px_rgba(0,0,0,0.9)]"
            :class="cardTone(item)"
          >
            <div class="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start">
              <div class="relative aspect-[4/3] overflow-hidden border border-white/10 bg-black/28">
                <img
                  v-if="item.type === 'image'"
                  :src="item.preview?.url ?? item.url"
                  :alt="item.title ?? ''"
                  class="h-full w-full object-cover"
                />
                <video
                  v-else-if="item.type === 'video'"
                  class="h-full w-full object-cover"
                  autoplay
                  muted
                  loop
                  playsinline
                  preload="metadata"
                >
                  <source :src="item.preview?.url ?? item.url" />
                </video>
                <div v-else class="grid h-full place-items-center px-4 text-center">
                  <div class="grid justify-items-center gap-3">
                    <span class="inline-flex h-12 w-12 items-center justify-center border border-white/12 bg-black/34 text-[#f7f1ea]/72">
                      <component :is="getItemIcon(item.type)" class="h-4 w-4 stroke-[2]" aria-hidden="true" />
                    </span>
                    <p class="text-[0.7rem] font-bold uppercase tracking-[0.24em] text-[#f7f1ea]/54">
                      {{ item.preview ? 'Preview available' : getItemLabel(item.type) }}
                    </p>
                  </div>
                </div>

                <span class="absolute left-3 top-3 inline-flex items-center gap-2 border border-white/12 bg-black/60 px-3 py-2 text-[0.66rem] font-bold uppercase tracking-[0.22em] text-[#f7f1ea]/76 backdrop-blur-[14px]">
                  <component :is="getItemIcon(item.type)" class="h-3.5 w-3.5 stroke-[2]" aria-hidden="true" />
                  <span>{{ getItemLabel(item.type) }}</span>
                </span>
              </div>

              <div class="grid gap-4">
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div class="min-w-0">
                    <h3 class="truncate text-[1.35rem] font-semibold tracking-[-0.04em] text-[#f7f1ea]">
                      {{ item.title ?? 'Untitled item' }}
                    </h3>
                    <p class="mt-1 break-all text-[0.78rem] uppercase tracking-[0.18em] text-[#f7f1ea]/42">{{ item.id }}</p>
                  </div>
                  <span class="border border-white/12 bg-black/36 px-3 py-2 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-[#f7f1ea]/68">
                    {{ item.type }}
                  </span>
                </div>

                <div class="grid gap-3 sm:grid-cols-2">
                  <div class="border border-white/10 bg-black/20 p-3">
                    <p class="text-[0.64rem] font-bold uppercase tracking-[0.24em] text-[#f7f1ea]/44">Main URL</p>
                    <p class="mt-2 break-all text-sm leading-6 text-[#f7f1ea]/72">{{ item.url }}</p>
                  </div>

                  <div class="border border-white/10 bg-black/20 p-3">
                    <p class="text-[0.64rem] font-bold uppercase tracking-[0.24em] text-[#f7f1ea]/44">Preview URL</p>
                    <p class="mt-2 break-all text-sm leading-6 text-[#f7f1ea]/72">
                      {{ item.preview?.url ?? 'No preview asset' }}
                    </p>
                  </div>
                </div>

                <div class="grid gap-3 sm:grid-cols-2">
                  <div class="border border-white/10 bg-black/20 p-3">
                    <p class="text-[0.64rem] font-bold uppercase tracking-[0.24em] text-[#f7f1ea]/44">Main dimensions</p>
                    <p class="mt-2 text-sm text-[#f7f1ea]/78">{{ formatDimensions(item.width, item.height) }}</p>
                  </div>

                  <div class="border border-white/10 bg-black/20 p-3">
                    <p class="text-[0.64rem] font-bold uppercase tracking-[0.24em] text-[#f7f1ea]/44">Preview dimensions</p>
                    <p class="mt-2 text-sm text-[#f7f1ea]/78">
                      {{ formatDimensions(item.preview?.width, item.preview?.height) }}
                    </p>
                  </div>
                </div>

                <div v-if="isVisualItem(item)" class="border border-white/10 bg-black/20 p-3">
                  <p class="text-[0.64rem] font-bold uppercase tracking-[0.24em] text-[#f7f1ea]/44">Visual type</p>
                  <p class="mt-2 text-sm text-[#f7f1ea]/78">
                    Main asset renders from `url`, preview card renders from `preview.url` when provided.
                  </p>
                </div>
              </div>
            </div>
          </article>
        </div>

        <aside class="grid gap-4 xl:sticky xl:top-5 xl:self-start">
          <div class="border border-white/12 bg-black/72 p-4 shadow-[0_24px_60px_-42px_rgba(0,0,0,0.88)]">
            <p class="text-[0.68rem] font-bold uppercase tracking-[0.28em] text-[#f7f1ea]/42">Response snapshot</p>
            <pre data-testid="fake-server-response-snapshot" class="mt-3 overflow-auto text-xs leading-6 text-[#f7f1ea]/78">{{ JSON.stringify(response, null, 2) }}</pre>
          </div>

          <div class="border border-white/12 bg-black/72 p-4 shadow-[0_24px_60px_-42px_rgba(0,0,0,0.88)]">
            <p class="text-[0.68rem] font-bold uppercase tracking-[0.28em] text-[#f7f1ea]/42">VibeRoot callback shape</p>
            <pre data-testid="fake-server-callback-snapshot" class="mt-3 overflow-auto text-xs leading-6 text-[#f7f1ea]/78">{{ JSON.stringify(vibeRootContractSnapshot, null, 2) }}</pre>
          </div>

          <div class="border border-white/10 bg-black/20 p-4">
            <p class="text-[0.68rem] font-bold uppercase tracking-[0.28em] text-[#f7f1ea]/42">What to verify</p>
            <ul class="mt-3 grid gap-2 text-sm leading-6 text-[#f7f1ea]/68">
              <li>Every item exposes `id`, `type`, `url`, and optionally `title` and `preview`.</li>
              <li>`VibeRoot` consumes a strict callback result of `items`, `nextPage`, and optional `previousPage`.</li>
              <li>Main `width` and `height` describe the main `url` asset, not preview-first dimensions.</li>
              <li>Preview dimensions only appear under `preview.width` and `preview.height`.</li>
              <li>The viewer can consume the same item objects without mime, file-size, or timestamp fields.</li>
              <li>`nextPage` becomes `null` on the last page.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  </section>
</template>
