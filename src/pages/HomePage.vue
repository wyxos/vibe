<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

import VibeRoot from '@/components/VibeRoot.vue'
import type { VibeViewerItem } from '@/components/vibeViewer'
import { fetchFakeMediaPage } from '@/demo/fakeServer'

const INITIAL_PAGE = 1
const PAGE_SIZE = 25
const PREFETCH_OFFSET = 3

const items = ref<VibeViewerItem[]>([])
const activeIndex = ref(0)
const nextPage = ref<string | null>(String(INITIAL_PAGE))
const isLoadingInitial = ref(true)
const isPrefetching = ref(false)
const hasReachedEnd = ref(false)
const errorMessage = ref<string | null>(null)

const loadedPages = new Set<string>()
const inFlightPages = new Set<string>()

const isViewerLoading = computed(() => isLoadingInitial.value || isPrefetching.value)

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
    void maybePrefetch()
  },
)

onMounted(async () => {
  await loadPage(String(INITIAL_PAGE), 'initial')
})

async function maybePrefetch() {
  if (!items.value.length || !nextPage.value || isLoadingInitial.value) {
    return
  }

  if (activeIndex.value < items.value.length - PREFETCH_OFFSET) {
    return
  }

  await loadPage(nextPage.value, 'prefetch')
}

async function loadPage(pageToken: string, mode: 'initial' | 'prefetch') {
  if (loadedPages.has(pageToken) || inFlightPages.has(pageToken)) {
    return
  }

  inFlightPages.add(pageToken)
  errorMessage.value = null

  if (mode === 'initial') {
    isLoadingInitial.value = true
  }
  else {
    isPrefetching.value = true
  }

  try {
    const response = await fetchFakeMediaPage({
      page: pageToken,
      pageSize: PAGE_SIZE,
    })

    loadedPages.add(pageToken)
    items.value = [...items.value, ...response.items]
    nextPage.value = response.nextPage
    hasReachedEnd.value = response.nextPage === null
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'The viewer could not load items.'
  }
  finally {
    inFlightPages.delete(pageToken)

    if (mode === 'initial') {
      isLoadingInitial.value = false
    }
    else {
      isPrefetching.value = inFlightPages.size > 0
    }
  }
}

async function retryInitialLoad() {
  if (items.value.length > 0 || isLoadingInitial.value) {
    return
  }

  nextPage.value = String(INITIAL_PAGE)
  hasReachedEnd.value = false
  await loadPage(String(INITIAL_PAGE), 'initial')
}
</script>

<template>
  <section class="relative h-full min-h-screen bg-[#05060a]">
    <button
      v-if="errorMessage && items.length === 0"
      type="button"
      class="absolute left-5 top-5 z-30 inline-flex items-center border border-rose-400/55 bg-rose-500/18 px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-white backdrop-blur transition hover:bg-rose-500/28"
      @click="retryInitialLoad"
    >
      Retry
    </button>

    <div
      v-if="errorMessage && items.length > 0"
      class="absolute left-5 top-5 z-30 border border-amber-400/45 bg-black/35 px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-amber-100 backdrop-blur"
    >
      {{ errorMessage }}
    </div>

    <VibeRoot
      :items="items"
      :active-index="activeIndex"
      :loading="isViewerLoading"
      :has-next-page="!hasReachedEnd"
      @update:active-index="activeIndex = $event"
    />
  </section>
</template>
