<script setup lang="ts">
import type { Component } from 'vue'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Laugh, Heart, ThumbsDown, ThumbsUp } from 'lucide-vue-next'

import VibeRoot from '@/components/VibeRoot.vue'
import type { VibeViewerItem } from '@/components/vibeViewer'
import type { VibeRootHandle } from '@/components/vibe-root/useVibeRoot'
import { getFakeMediaItemIcon } from '@/demo/fakeMediaItemIcon'
import { fetchFakeMediaPage } from '@/demo/fakeServer'

const INITIAL_PAGE = 10
const INITIAL_ACTIVE_OFFSET = 12
const PAGE_SIZE = 25
const REACTION_ACTIONS = [
  { icon: Heart, label: 'Favorite' },
  { icon: ThumbsUp, label: 'Like' },
  { icon: Laugh, label: 'Funny' },
  { icon: ThumbsDown, label: 'Dislike' },
] as const
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
const vibeRootRef = ref<VibeRootHandle | null>(null)

const loadedPages = new Set<string>()
const inFlightPages = new Set<string>()

const isViewerLoading = computed(() => isLoadingInitial.value || isPrefetchingNext.value || isPrefetchingPrevious.value)
const vibeStatus = computed(() => vibeRootRef.value?.status ?? null)
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
const demoStatusCurrentPage = computed(() => {
  if (!vibeStatus.value || earliestLoadedPage.value == null || vibeStatus.value.itemCount === 0) {
    return 'N/A'
  }

  return `P${earliestLoadedPage.value + Math.floor(vibeStatus.value.activeIndex / PAGE_SIZE)}`
})
const demoStatusLoadState = computed(() => {
  return vibeStatus.value?.loadState ?? (isViewerLoading.value ? 'loading' : (errorMessage.value ? 'failed' : 'loaded'))
})
const demoStatusEntries = computed(() => [
  {
    key: 'current-page',
    label: 'Viewing',
    testId: 'advanced-demo-status-current-page',
    value: demoStatusCurrentPage.value,
  },
  {
    key: 'next-page',
    label: 'Next',
    testId: 'advanced-demo-status-next-page',
    value: nextPage.value ? `P${nextPage.value}` : 'N/A',
  },
  {
    key: 'previous-page',
    label: 'Previous',
    testId: 'advanced-demo-status-previous-page',
    value: previousPage.value ? `P${previousPage.value}` : 'N/A',
  },
  {
    key: 'load-state',
    label: 'Status',
    testId: 'advanced-demo-status-load-state',
    value: demoStatusLoadState.value,
  },
  {
    key: 'loaded-items',
    label: 'Total',
    testId: 'advanced-demo-status-loaded-items',
    value: String(vibeStatus.value?.itemCount ?? items.value.length),
  },
])
const statusBarOffsetClass = computed(() => vibeStatus.value?.surfaceMode === 'fullscreen' ? 'bottom-24' : 'bottom-5')

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
  window.addEventListener('keydown', onWindowKeydown)
  await loadPage(String(INITIAL_PAGE), 'initial')
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onWindowKeydown)
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

function renderItemIcon(item: VibeViewerItem, icon: unknown) {
  return (getFakeMediaItemIcon(item) ?? icon) as Component
}

function removeItemById(id: string) {
  vibeRootRef.value?.remove(id)
}

function onWindowKeydown(event: KeyboardEvent) {
  if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'z') {
    return
  }

  if (event.defaultPrevented) {
    return
  }

  const target = event.target
  if (target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) {
    return
  }

  event.preventDefault()
  vibeRootRef.value?.undo()
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
      ref="vibeRootRef"
      :items="items"
      :active-index="activeIndex"
      :loading="isViewerLoading"
      :has-next-page="Boolean(nextPage)"
      :has-previous-page="Boolean(previousPage)"
      :pagination-detail="paginationDetailLabel"
      :request-next-page="requestNextPage"
      :request-previous-page="requestPreviousPage"
      @update:active-index="activeIndex = $event"
    >
      <template #grid-item-overlay="{ focused, hovered, item }">
        <div
          v-if="hovered || focused"
          class="absolute inset-x-0 bottom-0 p-3"
        >
          <div
            data-testid="demo-reaction-bar"
            class="pointer-events-auto flex items-center justify-center gap-2 border border-white/12 bg-black/45 px-3 py-2 backdrop-blur-[18px]"
          >
            <button
              v-for="action in REACTION_ACTIONS"
              :key="action.label"
              type="button"
              class="inline-flex h-9 w-9 items-center justify-center border border-white/12 bg-white/[0.03] text-[#f7f1ea]/76 transition hover:border-white/24 hover:bg-white/[0.08] hover:text-[#f7f1ea]"
              :aria-label="`${action.label} ${item.title ?? item.id}`"
              data-testid="demo-reaction-button"
              @click.stop.prevent="removeItemById(item.id)"
            >
              <component :is="action.icon" class="h-4 w-4 stroke-[2]" aria-hidden="true" />
            </button>
          </div>
        </div>
      </template>
      <template #item-icon="{ item, icon }">
        <component :is="renderItemIcon(item, icon)" class="h-6 w-6 stroke-[1.9]" aria-hidden="true" />
      </template>
    </VibeRoot>

    <div
      data-testid="advanced-demo-status-bar"
      class="pointer-events-none absolute inset-x-0 z-40 px-5 sm:px-6"
      :class="statusBarOffsetClass"
    >
      <div class="mx-auto flex w-full max-w-[1600px] justify-center">
        <div class="pointer-events-auto flex w-full max-w-[1120px] flex-wrap items-center justify-center gap-x-5 gap-y-2 border border-white/12 bg-black/55 px-4 py-3 backdrop-blur-[18px] sm:px-5">
          <div
            v-for="entry in demoStatusEntries"
            :key="entry.key"
            :data-testid="entry.testId"
            class="flex items-baseline gap-2"
          >
            <span class="text-[0.6rem] font-bold uppercase tracking-[0.24em] text-[#f7f1ea]/46">
              {{ entry.label }}
            </span>
            <span class="text-[0.72rem] font-medium uppercase tracking-[0.18em] text-[#f7f1ea]/82">
              {{ entry.value }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
