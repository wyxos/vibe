<script setup lang="ts">
import { computed, ref } from 'vue'

import Masonry from '@/components/Masonry.vue'
import MasonryItem from '@/components/MasonryItem.vue'
import { type FeedItem, fetchSearchPage, makeSearchPageToken, type PageToken } from '@/demo/fakeServer'
import { setReaction, useExposeDebugRef } from '@/demo/demoUtils'

const items = ref<FeedItem[]>([])
const masonryRef = ref<{
  remove?: (itemsOrIds: Array<string | FeedItem> | string | FeedItem) => Promise<void>
} | null>(null)

useExposeDebugRef(masonryRef)

const searchInput = ref('')
const appliedQuery = ref('')

const pageToken = computed<PageToken>(() => makeSearchPageToken({ page: 1, query: appliedQuery.value }))

async function getContent(pageToken: PageToken) {
  return fetchSearchPage(pageToken)
}

function applySearch() {
  appliedQuery.value = searchInput.value.trim()
  // Optional: clear immediately; Masonry also resets on page prop change.
  items.value = []
}
</script>

<template>
  <div class="h-full min-h-0 overflow-hidden">
    <div
      class="mx-auto flex h-full min-h-0 max-w-7xl flex-col px-6 py-10 2xl:max-w-screen-2xl 2xl:px-10 min-[1920px]:!max-w-[1800px] min-[1920px]:!px-12 min-[2560px]:!max-w-[2200px]"
    >
      <header class="flex flex-wrap items-center gap-4">
        <div class="min-w-0">
          <h1 class="text-2xl font-semibold tracking-tight text-slate-900">Search</h1>
          <p class="text-sm text-slate-600">Example: apply search reloads Masonry from page 1.</p>
        </div>

        <div class="ml-auto flex flex-wrap items-center justify-end gap-2">
          <input
            data-testid="search-input"
            v-model="searchInput"
            type="text"
            placeholder="Search (e.g. video, p12, i3)"
            class="h-9 w-64 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400"
            @keydown.enter.prevent="applySearch"
          />
          <button
            data-testid="apply-search"
            type="button"
            class="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            @click="applySearch"
          >
            Apply
          </button>
        </div>
      </header>

      <Masonry
        ref="masonryRef"
        v-model:items="items"
        :get-content="getContent"
        :page="pageToken"
        :header-height="45"
        :footer-height="54"
      >
        <MasonryItem>
          <template #header="{ item }">
            <div class="flex h-full items-center justify-between gap-3 border-b border-slate-200/60 px-4">
              <span
                class="inline-flex items-center rounded-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 px-2 py-0.5 text-xs font-medium text-slate-700"
              >
                {{ item.type }}
              </span>

              <span class="truncate font-mono text-xs text-slate-500">{{ item.id }}</span>
            </div>
          </template>

          <template #footer="{ item, remove }">
            <div class="flex h-full items-center justify-end gap-2 px-4">
            <button
              type="button"
              class="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium hover:bg-slate-50"
              :class="item.reaction === 'love' ? 'bg-slate-100 text-slate-900' : 'text-slate-700'"
              :aria-pressed="item.reaction === 'love'"
              title="Love"
              @click="setReaction(item as FeedItem, 'love')"
            >
              <i :class="item.reaction === 'love' ? 'fa-solid fa-heart' : 'fa-regular fa-heart'" aria-hidden="true" />
              <span class="sr-only">Love</span>
            </button>

            <button
              type="button"
              class="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium hover:bg-slate-50"
              :class="item.reaction === 'like' ? 'bg-slate-100 text-slate-900' : 'text-slate-700'"
              :aria-pressed="item.reaction === 'like'"
              title="Like"
              @click="setReaction(item as FeedItem, 'like')"
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
              @click="setReaction(item as FeedItem, 'dislike')"
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
        </MasonryItem>
      </Masonry>
    </div>
  </div>
</template>
