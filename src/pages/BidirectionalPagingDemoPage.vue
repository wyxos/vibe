<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

import VibeRoot from '@/components/VibeRoot.vue'
import type { VibeViewerItem } from '@/components/vibeViewer'
import { fetchFakeMediaPage } from '@/demo/fakeServer'

const INITIAL_PAGE = 10
const INITIAL_ACTIVE_OFFSET = 12
const PAGE_SIZE = 25
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
    return `P${INITIAL_PAGE}`
  }

  if (earliestLoadedPage.value === latestLoadedPage.value) {
    return `P${earliestLoadedPage.value}`
  }

  return `P${earliestLoadedPage.value}-${latestLoadedPage.value}`
})
const paginationDetailLabel = computed(() => {
  return `${loadedPageRangeLabel.value} · V${currentVisiblePage.value}`
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

onMounted(async () => {
  await loadPage(String(INITIAL_PAGE), 'initial')
})

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

async function requestNextPage() {
  if (!nextPage.value || isViewerLoading.value) {
    return
  }

  await loadPage(nextPage.value, 'append')
}

async function requestPreviousPage() {
  if (!previousPage.value || isViewerLoading.value) {
    return
  }

  await loadPage(previousPage.value, 'prepend')
}
</script>

<template>
  <section class="relative h-full min-h-0 bg-[#05060a]">
    <button
      v-if="errorMessage && items.length === 0"
      type="button"
      class="absolute left-5 top-20 z-40 inline-flex items-center border border-rose-400/55 bg-rose-500/18 px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-white backdrop-blur transition hover:bg-rose-500/28"
      @click="retryInitialLoad"
    >
      Retry
    </button>

    <div
      v-if="errorMessage && items.length > 0"
      class="absolute left-5 top-20 z-40 border border-amber-400/45 bg-black/35 px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-amber-100 backdrop-blur"
    >
      {{ errorMessage }}
    </div>

    <VibeRoot
      :items="items"
      :active-index="activeIndex"
      :loading="isViewerLoading"
      :has-next-page="Boolean(nextPage)"
      :has-previous-page="Boolean(previousPage)"
      :pagination-detail="paginationDetailLabel"
      :request-next-page="requestNextPage"
      :request-previous-page="requestPreviousPage"
      @update:active-index="activeIndex = $event"
    />
  </section>
</template>
