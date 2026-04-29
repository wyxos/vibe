<script setup lang="ts">
import { computed, ref } from 'vue'

import Layout from '@/components/Layout.vue'
import type { VibeViewerItem } from '@/components/viewer'
import type { VibeHandle, VibeResolveParams, VibeResolveResult } from '@/components/viewer-core/useViewer'

const PAGE_SIZE = 10
const CURRENT_CURSOR = 'page-5'
const NEXT_CURSOR = 'page-6'
const PREVIOUS_CURSOR = 'page-4'
const REMOVED_NUMBERS = [5, 7]
const INITIAL_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const REFRESHED_NUMBERS = [1, 2, 3, 4, 6, 8, 9, 10, 11, 12]
const NEXT_NUMBERS = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22]
const IMAGE_IDS = [1015, 1027, 1060, 1040, 1003, 1039, 1011, 1025, 1035, 1043, 1050, 1057]

const vibeRef = ref<VibeHandle | null>(null)
const resolveCalls = ref<Array<string | null>>([])

const initialItems = INITIAL_NUMBERS.map(createScenarioItem)
const removedIds = REMOVED_NUMBERS.map(getScenarioItemId)
const initialState = {
  activeIndex: 0,
  cursor: CURRENT_CURSOR,
  items: initialItems,
  nextCursor: NEXT_CURSOR,
  previousCursor: PREVIOUS_CURSOR,
}
const visibleNumbers = computed(() => {
  return vibeRef.value?.getItems().map((item) => Number(item.scenarioNumber)).filter(Number.isFinite) ?? INITIAL_NUMBERS
})
const phaseLabel = computed(() => vibeRef.value?.status.phase ?? 'idle')
const itemCount = computed(() => vibeRef.value?.status.itemCount ?? initialItems.length)
const removedCount = computed(() => vibeRef.value?.status.removedCount ?? 0)
const nextCursor = computed(() => vibeRef.value?.status.nextCursor ?? NEXT_CURSOR)
const canRemoveScenarioItems = computed(() => removedCount.value === 0)
const canTriggerRefresh = computed(() => removedCount.value > 0)

async function resolveScenarioPage({ cursor }: VibeResolveParams): Promise<VibeResolveResult> {
  resolveCalls.value = [...resolveCalls.value, cursor]
  await new Promise((resolve) => window.setTimeout(resolve, 260))

  if (cursor === CURRENT_CURSOR || cursor === null) {
    return {
      items: REFRESHED_NUMBERS.map(createScenarioItem),
      nextPage: NEXT_CURSOR,
      previousPage: PREVIOUS_CURSOR,
    }
  }

  return {
    items: NEXT_NUMBERS.map(createScenarioItem),
    nextPage: 'page-7',
    previousPage: CURRENT_CURSOR,
  }
}

function removeScenarioItems() {
  vibeRef.value?.remove(removedIds)
}

async function refreshBoundary() {
  await vibeRef.value?.loadNext()
}

function resetDemo() {
  window.location.reload()
}

function createScenarioItem(number: number): VibeViewerItem {
  const imageId = IMAGE_IDS[(number - 1) % IMAGE_IDS.length]

  return {
    id: getScenarioItemId(number),
    preview: {
      height: 520,
      url: `https://picsum.photos/id/${imageId}/780/520`,
      width: 780,
    },
    type: 'image',
    scenarioNumber: number,
    title: `Page 5 item ${number}`,
    url: `https://picsum.photos/id/${imageId}/1560/1040`,
    width: 1560,
    height: 1040,
  }
}

function getScenarioItemId(number: number) {
  return `page-5-item-${number}`
}
</script>

<template>
  <section class="grid h-full min-h-0 bg-[#05060a] text-[#f7f1ea] xl:grid-cols-[24rem_minmax(0,1fr)]">
    <aside class="z-10 grid content-start gap-4 border-b border-white/12 bg-black/50 p-5 shadow-[20px_0_80px_-60px_rgba(0,0,0,0.92)] backdrop-blur-[18px] xl:border-b-0 xl:border-r">
      <div class="grid gap-2">
        <p class="text-[0.68rem] font-bold uppercase tracking-[0.28em] text-[#f7f1ea]/44">Refresh append debug</p>
        <h1 class="text-2xl font-semibold tracking-[-0.04em] text-[#f7f1ea]">Page 5</h1>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div class="border border-white/10 bg-white/[0.035] p-3">
          <p class="text-[0.62rem] font-bold uppercase tracking-[0.22em] text-[#f7f1ea]/42">Visible</p>
          <p class="mt-2 text-xl font-semibold">{{ itemCount }}</p>
        </div>
        <div class="border border-white/10 bg-white/[0.035] p-3">
          <p class="text-[0.62rem] font-bold uppercase tracking-[0.22em] text-[#f7f1ea]/42">Phase</p>
          <p class="mt-2 text-xl font-semibold capitalize">{{ phaseLabel }}</p>
        </div>
        <div class="border border-white/10 bg-white/[0.035] p-3">
          <p class="text-[0.62rem] font-bold uppercase tracking-[0.22em] text-[#f7f1ea]/42">Removed</p>
          <p class="mt-2 text-xl font-semibold">{{ removedCount }}</p>
        </div>
        <div class="border border-white/10 bg-white/[0.035] p-3">
          <p class="text-[0.62rem] font-bold uppercase tracking-[0.22em] text-[#f7f1ea]/42">Next</p>
          <p class="mt-2 text-xl font-semibold">{{ nextCursor }}</p>
        </div>
      </div>

      <div class="grid gap-2">
        <button
          type="button"
          class="h-11 border border-rose-300/36 bg-rose-500/14 px-4 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-rose-50 transition enabled:hover:border-rose-200/56 enabled:hover:bg-rose-500/22 disabled:cursor-default disabled:opacity-35"
          :disabled="!canRemoveScenarioItems"
          @click="removeScenarioItems"
        >
          Remove 5 + 7
        </button>
        <button
          type="button"
          class="h-11 border border-amber-300/36 bg-amber-400/12 px-4 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-amber-50 transition enabled:hover:border-amber-200/56 enabled:hover:bg-amber-400/20 disabled:cursor-default disabled:opacity-35"
          :disabled="!canTriggerRefresh"
          @click="refreshBoundary"
        >
          Refresh boundary
        </button>
        <button
          type="button"
          class="h-11 border border-white/12 bg-white/[0.04] px-4 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-[#f7f1ea]/76 transition hover:border-white/24 hover:bg-white/[0.08]"
          @click="resetDemo"
        >
          Reset
        </button>
      </div>

      <div class="grid gap-3 border border-white/10 bg-white/[0.035] p-4">
        <p class="text-[0.62rem] font-bold uppercase tracking-[0.22em] text-[#f7f1ea]/42">Visible order</p>
        <p class="text-lg font-semibold tracking-[-0.02em] text-[#f7f1ea]">{{ visibleNumbers.join(', ') }}</p>
      </div>

      <div class="grid gap-3 border border-white/10 bg-white/[0.035] p-4">
        <p class="text-[0.62rem] font-bold uppercase tracking-[0.22em] text-[#f7f1ea]/42">Resolver calls</p>
        <p class="text-sm leading-6 text-[#f7f1ea]/70">{{ resolveCalls.length ? resolveCalls.join(' -> ') : 'none' }}</p>
      </div>
    </aside>

    <div class="relative min-h-[40rem] min-w-0">
      <Layout
        ref="vibeRef"
        :initial-state="initialState"
        :page-size="PAGE_SIZE"
        :resolve="resolveScenarioPage"
        :show-status-badges="false"
        surface-mode="list"
      >
        <template #grid-item-overlay="{ item }">
          <div class="absolute inset-0 p-3">
            <div class="inline-flex h-10 min-w-10 items-center justify-center border border-white/14 bg-black/62 px-3 text-sm font-bold text-[#f7f1ea] backdrop-blur-[18px]">
              {{ item.scenarioNumber }}
            </div>
          </div>
        </template>
      </Layout>
    </div>
  </section>
</template>
