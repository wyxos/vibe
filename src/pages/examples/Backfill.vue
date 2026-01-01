<script setup lang="ts">
import { computed, ref } from 'vue'
import { type BackfillFeedItem, fetchBackfillPage, type PageToken } from '@/demo/fakeServerBackfill'
import type { BackfillStats } from '@/masonry/types'
import Masonry from '@/components/Masonry.vue'
import {
  buildPagesLoadedLabel,
  getInitialPageToken,
  setReaction,
  useExposeDebugRef,
} from '@/demo/demoUtils'

const items = ref<BackfillFeedItem[]>([])
const masonryRef = ref<{ backfillStats?: unknown } | null>(null)

useExposeDebugRef(masonryRef)

const backfillStats = computed(() => {
  const inst = masonryRef.value as null | {
    backfillStats?: BackfillStats | { value: BackfillStats }
  }
  const state = inst?.backfillStats
  if (!state) return null
  if (typeof state === 'object' && state && 'value' in state)
    return (state as { value: BackfillStats }).value
  return state as BackfillStats
})

const cooldownSeconds = computed(() => {
  const remaining = backfillStats.value?.cooldownMsRemaining ?? 0
  if (!remaining) return 0
  return Math.max(0, Math.ceil(remaining / 1000))
})

const cooldownProgressPct = computed(() => {
  const total = backfillStats.value?.cooldownMsTotal ?? 0
  const remaining = backfillStats.value?.cooldownMsRemaining ?? 0
  if (!total) return 0
  const pct = ((total - remaining) / total) * 100
  return Math.max(0, Math.min(100, pct))
})

const initialPageToken = computed<PageToken>(() => getInitialPageToken('page', 1))

function getPageLabelFromId(id: string | null | undefined) {
  if (!id) return null
  const s = String(id)
  const m = /^bf-p(\d+)-i\d+/.exec(s)
  return m ? m[1] : null
}

const pagesLoadedLabel = computed(() => {
  return buildPagesLoadedLabel(items.value, getPageLabelFromId)
})

async function getContent(pageToken: PageToken) {
  return fetchBackfillPage(pageToken)
}
</script>

<template>
  <div class="h-full min-h-0 overflow-hidden">
    <div
      class="mx-auto flex h-full min-h-0 max-w-7xl flex-col px-6 py-10 2xl:max-w-screen-2xl 2xl:px-10 min-[1920px]:!max-w-[1800px] min-[1920px]:!px-12 min-[2560px]:!max-w-[2200px]"
    >
      <header class="flex items-center gap-4">
        <div class="min-w-0">
          <h1 class="text-2xl font-semibold tracking-tight text-slate-900">Backfill</h1>
          <p class="text-sm text-slate-600">
            Example: server may return short pages (filters/moderation/seen items); Masonry backfills to
            keep the feed populated.
          </p>
        </div>

        <div class="ml-auto flex flex-wrap items-center justify-end gap-2">
          <span
            class="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700"
          >
            <span class="text-slate-600">Pages loaded:</span>
            <span data-testid="pages-loaded" class="ml-2 tabular-nums text-slate-900">{{ pagesLoadedLabel }}</span>
          </span>

          <button
            type="button"
            class="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            @click="(masonryRef as any)?.undo?.()"
          >
            Undo last remove
          </button>

          <span
            class="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700"
          >
            Backfill active: {{ backfillStats?.isBackfillActive ? 'yes' : 'no' }}
          </span>

          <span
            class="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700"
          >
            Backfill request: {{ backfillStats?.isRequestInFlight ? 'running' : 'idle' }}
          </span>

          <span
            class="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700"
          >
            {{ backfillStats?.progress?.collected ?? 0 }}/{{ backfillStats?.progress?.target ?? 0 }}
          </span>

          <span
            class="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700"
          >
            <span>Cooldown</span>
            <span class="relative h-2 w-20 overflow-hidden rounded-full bg-slate-200">
              <span
                class="absolute inset-y-0 left-0 bg-slate-500"
                :style="{ width: cooldownProgressPct + '%' }"
              />
            </span>
            <span class="tabular-nums text-slate-600">{{ cooldownSeconds }}s</span>
          </span>
        </div>
      </header>

      <Masonry
        ref="masonryRef"
        v-model:items="items"
        mode="backfill"
        :page-size="20"
        :backfill-request-delay-ms="2000"
        :get-content="getContent"
        :page="initialPageToken"
        :header-height="45"
        :footer-height="54"
      >
        <template #itemHeader="{ item }">
          <div class="flex h-full items-center justify-between gap-3 border-b border-slate-200/60 px-4">
            <span
              class="inline-flex items-center rounded-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 px-2 py-0.5 text-xs font-medium text-slate-700"
            >
              {{ item.type }}
            </span>

            <span class="truncate font-mono text-xs text-slate-500">{{ item.id }}</span>
          </div>
        </template>

        <template #itemFooter="{ item, remove }">
          <div class="flex h-full items-center justify-end gap-2 px-4">
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium hover:bg-slate-50"
              :class="item.reaction === 'love' ? 'bg-slate-100 text-slate-900' : 'text-slate-700'"
              :aria-pressed="item.reaction === 'love'"
              title="Love"
              @click="setReaction(item as BackfillFeedItem, 'love')"
            >
              <i
                :class="item.reaction === 'love' ? 'fa-solid fa-heart' : 'fa-regular fa-heart'"
                aria-hidden="true"
              />
              <span class="sr-only">Love</span>
            </button>

            <button
              type="button"
              class="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium hover:bg-slate-50"
              :class="item.reaction === 'like' ? 'bg-slate-100 text-slate-900' : 'text-slate-700'"
              :aria-pressed="item.reaction === 'like'"
              title="Like"
              @click="setReaction(item as BackfillFeedItem, 'like')"
            >
              <i
                :class="item.reaction === 'like' ? 'fa-solid fa-thumbs-up' : 'fa-regular fa-thumbs-up'"
                aria-hidden="true"
              />
              <span class="sr-only">Like</span>
            </button>

            <button
              type="button"
              class="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium hover:bg-slate-50"
              :class="item.reaction === 'dislike' ? 'bg-slate-100 text-slate-900' : 'text-slate-700'"
              :aria-pressed="item.reaction === 'dislike'"
              title="Dislike"
              @click="setReaction(item as BackfillFeedItem, 'dislike')"
            >
              <i
                :class="item.reaction === 'dislike' ? 'fa-solid fa-thumbs-down' : 'fa-regular fa-thumbs-down'"
                aria-hidden="true"
              />
              <span class="sr-only">Dislike</span>
            </button>

            <button
              type="button"
              :data-testid="'remove-' + item.id"
              class="inline-flex items-center justify-center rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
              title="Remove"
              @click="remove()"
            >
              <i class="fa-solid fa-trash" aria-hidden="true" />
              <span class="sr-only">Remove</span>
            </button>
          </div>
        </template>
      </Masonry>
    </div>
  </div>
</template>
