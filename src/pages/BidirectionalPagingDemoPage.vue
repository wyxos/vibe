<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'

import VibeRoot from '@/components/VibeRoot.vue'
import type { VibeViewerItem } from '@/components/vibeViewer'
import { fetchFakeMediaPage } from '@/demo/fakeServer'

const INITIAL_PAGE = 10
const INITIAL_ACTIVE_OFFSET = 3
const PAGE_SIZE = 25
const PREFETCH_OFFSET = 3

const items = ref<VibeViewerItem[]>([])
const activeIndex = ref(0)
const earliestLoadedPage = ref<number | null>(null)
const latestLoadedPage = ref<number | null>(null)
const totalPages = ref(1)
const nextPage = ref<string | null>(null)
const previousPage = ref<string | null>(null)
const isLoadingInitial = ref(true)
const isPrefetchingNext = ref(false)
const isPrefetchingPrevious = ref(false)
const errorMessage = ref<string | null>(null)

const loadedPages = new Set<string>()
const inFlightPages = new Set<string>()

const isViewerLoading = computed(() => isLoadingInitial.value || isPrefetchingNext.value || isPrefetchingPrevious.value)
const currentVisiblePage = computed(() => {
  if (earliestLoadedPage.value == null || items.value.length === 0) {
    return INITIAL_PAGE
  }

  return earliestLoadedPage.value + Math.floor(activeIndex.value / PAGE_SIZE)
})
const loadedPageRangeLabel = computed(() => {
  if (earliestLoadedPage.value == null || latestLoadedPage.value == null) {
    return `Page ${INITIAL_PAGE}`
  }

  if (earliestLoadedPage.value === latestLoadedPage.value) {
    return `Page ${earliestLoadedPage.value}`
  }

  return `Pages ${earliestLoadedPage.value}-${latestLoadedPage.value}`
})

watch(
  () => items.value.length,
  (length) => {
    if (length === 0) {
      activeIndex.value = 0
      return
    }

    if (activeIndex.value > length - 1) {
      activeIndex.value = length - 1
    }
  },
)

watch(
  () => activeIndex.value,
  () => {
    void maybePrefetchAround()
  },
)

onMounted(async () => {
  await loadPage(String(INITIAL_PAGE), 'initial')
})

async function maybePrefetchAround() {
  if (!items.value.length || isLoadingInitial.value) {
    return
  }

  if (previousPage.value && activeIndex.value < PREFETCH_OFFSET) {
    await loadPage(previousPage.value, 'prepend')
  }

  if (nextPage.value && activeIndex.value >= items.value.length - PREFETCH_OFFSET) {
    await loadPage(nextPage.value, 'append')
  }
}

async function loadPage(pageToken: string, mode: 'initial' | 'prepend' | 'append') {
  if (loadedPages.has(pageToken) || inFlightPages.has(pageToken)) {
    return
  }

  inFlightPages.add(pageToken)
  errorMessage.value = null

  if (mode === 'initial') {
    isLoadingInitial.value = true
  }
  else if (mode === 'prepend') {
    isPrefetchingPrevious.value = true
  }
  else {
    isPrefetchingNext.value = true
  }

  try {
    const response = await fetchFakeMediaPage({
      page: pageToken,
      pageSize: PAGE_SIZE,
    })

    loadedPages.add(String(response.page))
    totalPages.value = response.totalPages

    if (mode === 'initial') {
      items.value = response.items
      activeIndex.value = Math.min(INITIAL_ACTIVE_OFFSET, Math.max(response.items.length - 1, 0))
      earliestLoadedPage.value = response.page
      latestLoadedPage.value = response.page
    }
    else if (mode === 'prepend') {
      items.value = [...response.items, ...items.value]
      activeIndex.value += response.items.length
      earliestLoadedPage.value = response.page
    }
    else {
      items.value = [...items.value, ...response.items]
      latestLoadedPage.value = response.page
    }

    updatePageBounds()
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'The demo could not load items.'
  }
  finally {
    inFlightPages.delete(pageToken)

    if (mode === 'initial') {
      isLoadingInitial.value = false
    }
    else if (mode === 'prepend') {
      isPrefetchingPrevious.value = false
    }
    else {
      isPrefetchingNext.value = false
    }
  }
}

function updatePageBounds() {
  if (earliestLoadedPage.value == null || latestLoadedPage.value == null) {
    previousPage.value = null
    nextPage.value = null
    return
  }

  previousPage.value = earliestLoadedPage.value > 1 ? String(earliestLoadedPage.value - 1) : null
  nextPage.value = latestLoadedPage.value < totalPages.value ? String(latestLoadedPage.value + 1) : null
}

async function retryInitialLoad() {
  if (items.value.length > 0 || isLoadingInitial.value) {
    return
  }

  earliestLoadedPage.value = null
  latestLoadedPage.value = null
  nextPage.value = null
  previousPage.value = null
  loadedPages.clear()

  await loadPage(String(INITIAL_PAGE), 'initial')
}
</script>

<template>
  <section class="relative h-full min-h-screen bg-[#05060a]">
    <div class="pointer-events-none absolute inset-x-0 top-0 z-40 flex justify-between gap-3 p-5">
      <div class="pointer-events-auto flex flex-wrap items-center gap-2">
        <RouterLink
          to="/debug/fake-server"
          class="inline-flex items-center border border-white/18 bg-black/45 px-4 py-3 text-[0.72rem] font-bold uppercase tracking-[0.22em] text-[#f7f1ea]/78 backdrop-blur-[18px] transition hover:border-white/30 hover:bg-black/60"
        >
          Back To Demos
        </RouterLink>
        <span class="inline-flex items-center border border-white/14 bg-black/40 px-4 py-3 text-[0.72rem] font-bold uppercase tracking-[0.22em] text-[#f7f1ea]/72 backdrop-blur-[18px]">
          Starts On Page {{ INITIAL_PAGE }}
        </span>
      </div>

      <div class="pointer-events-auto flex flex-wrap items-center justify-end gap-2 text-right">
        <span
          data-testid="bidirectional-loaded-pages"
          class="inline-flex items-center border border-white/14 bg-black/40 px-4 py-3 text-[0.72rem] font-bold uppercase tracking-[0.22em] text-[#f7f1ea]/72 backdrop-blur-[18px]"
        >
          {{ loadedPageRangeLabel }}
        </span>
        <span
          data-testid="bidirectional-current-page"
          class="inline-flex items-center border border-white/14 bg-black/40 px-4 py-3 text-[0.72rem] font-bold uppercase tracking-[0.22em] text-[#f7f1ea]/72 backdrop-blur-[18px]"
        >
          Viewing Page {{ currentVisiblePage }}
        </span>
      </div>
    </div>

    <button
      v-if="errorMessage && items.length === 0"
      type="button"
      class="absolute left-5 top-24 z-40 inline-flex items-center border border-rose-400/55 bg-rose-500/18 px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-white backdrop-blur transition hover:bg-rose-500/28"
      @click="retryInitialLoad"
    >
      Retry
    </button>

    <div
      v-if="errorMessage && items.length > 0"
      class="absolute left-5 top-24 z-40 border border-amber-400/45 bg-black/35 px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-amber-100 backdrop-blur"
    >
      {{ errorMessage }}
    </div>

    <VibeRoot
      :items="items"
      :active-index="activeIndex"
      :loading="isViewerLoading"
      :has-next-page="Boolean(nextPage)"
      @update:active-index="activeIndex = $event"
    />
  </section>
</template>
