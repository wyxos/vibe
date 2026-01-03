<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import Masonry from '@/components/Masonry.vue'
import MasonryItem from '@/components/MasonryItem.vue'
import { type FeedItem, fetchPage, type PageToken } from '@/demo/fakeServer'
import type { MasonryRestoredPages } from '@/masonry/types'
import { setReaction, useExposeDebugRef } from '@/demo/demoUtils'
import { highlightVueSnippet, useCopyToClipboard } from '@/demo/codeSheet'

const items = ref<FeedItem[]>([])
const restoredPages = ref<MasonryRestoredPages | null>(null)

const masonryRef = ref<{
  remove?: (itemsOrIds: Array<string | FeedItem> | string | FeedItem) => Promise<void>
  nextPage?: unknown
} | null>(null)

useExposeDebugRef(masonryRef)

const initialPageToken: PageToken = 1

const isCodeSheetOpen = ref(false)

const showcasedCode = `<script setup lang="ts">
import { onMounted, ref } from 'vue'

import Masonry from '@wyxos/vibe'
import { type FeedItem, fetchPage, type PageToken } from './server'
import type { MasonryRestoredPages } from '@wyxos/vibe'

const items = ref<FeedItem[]>([])
const restoredPages = ref<MasonryRestoredPages | null>(null)

const initialPageToken: PageToken = 1

async function getContent(pageToken: PageToken) {
  return fetchPage(pageToken)
}

onMounted(async () => {
  const lastLoadedPage = 5
  const results = await Promise.all(Array.from({ length: lastLoadedPage }, (_, i) => fetchPage(i + 1)))
  items.value = results.flatMap((r) => r.items)
  restoredPages.value = lastLoadedPage
})
</scr${'ipt'}>

<template>
  <Masonry
    v-model:items="items"
    :get-content="getContent"
    :page="initialPageToken"
    :restored-pages="restoredPages"
  >
    <MasonryItem>
      <template #default="{ item }">{{ item.id }}</template>
    </MasonryItem>
  </Masonry>
</template>
`

const highlightedCode = computed(() => highlightVueSnippet(showcasedCode))
const { copyStatus, copy: copyShowcasedCode } = useCopyToClipboard(() => showcasedCode)

const pagesLoadedLabel = computed(() => {
  const v = restoredPages.value
  if (!v) return '—'
  return Array.isArray(v) ? v.join(', ') : String(v)
})

const nextPageLabel = computed(() => {
  const inst = masonryRef.value as null | { nextPage?: unknown }
  const state = inst?.nextPage
  if (!state) return '—'
  if (typeof state === 'object' && state && 'value' in state)
    return String((state as { value: PageToken | null }).value ?? '—')
  return String(state)
})

function getPageLabelFromId(id: string | null | undefined) {
  if (!id) return null
  const s = String(id)

  // Demo ids are often like: p12-i3
  const m1 = /^p(\d+)-i\d+/.exec(s)
  if (m1) return m1[1]

  // Test/demo ids may be like: 12-3
  const m2 = /^(\d+)-/.exec(s)
  if (m2) return m2[1]

  return null
}

async function getContent(pageToken: PageToken) {
  return fetchPage(pageToken)
}

onMounted(async () => {
  // Simulate "app re-open": parent eagerly restores items from persistence.
  // Here we just fetch pages 1..5 up front before mounting Masonry.
  const lastLoadedPage = 5
  const pagesToRestore = Array.from({ length: lastLoadedPage }, (_, i) => i + 1)
  const results = await Promise.all(pagesToRestore.map((p) => fetchPage(p)))

  items.value = results.flatMap((r) => r.items)

  // Parent provides pagesLoaded. Sometimes this is full history (e.g. [1..5]),
  // sometimes just the last loaded page (e.g. 5).
  restoredPages.value = lastLoadedPage
})
</script>

<template>
  <div class="h-full min-h-0 overflow-hidden">
    <div
      class="mx-auto flex h-full min-h-0 max-w-7xl flex-col px-6 py-10 2xl:max-w-screen-2xl 2xl:px-10 min-[1920px]:!max-w-[1800px] min-[1920px]:!px-12 min-[2560px]:!max-w-[2200px]"
    >
      <header class="flex items-center gap-4">
        <div class="min-w-0">
          <h1 class="text-2xl font-semibold tracking-tight text-slate-900">Resume session</h1>
          <p class="text-sm text-slate-600">
            Example: restore previously browsed items + restore pagination state (current pages + next page).
          </p>
        </div>

        <div class="ml-auto flex flex-wrap items-center justify-end gap-2">
          <span
            class="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700"
          >
            <span class="text-slate-600">Pages restored:</span>
            <span data-testid="pages-loaded" class="ml-2 tabular-nums text-slate-900">{{ pagesLoadedLabel }}</span>
          </span>

          <span
            class="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700"
          >
            <span class="text-slate-600">Next page:</span>
            <span data-testid="next-page" class="ml-2 tabular-nums text-slate-900">{{ nextPageLabel }}</span>
          </span>

          <button
            type="button"
            class="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            title="Show code"
            :aria-pressed="isCodeSheetOpen"
            @click="isCodeSheetOpen = !isCodeSheetOpen"
          >
            <i class="fa-solid fa-code" aria-hidden="true" />
            <span class="sr-only">Show code</span>
          </button>
        </div>
      </header>

      <Transition
        enter-active-class="transition duration-200 ease-out transform"
        enter-from-class="translate-x-6 opacity-0"
        enter-to-class="translate-x-0 opacity-100"
        leave-active-class="transition duration-150 ease-in transform"
        leave-from-class="translate-x-0 opacity-100"
        leave-to-class="translate-x-6 opacity-0"
      >
        <aside
          v-if="isCodeSheetOpen"
          class="fixed right-0 top-0 z-50 flex h-full w-1/2 flex-col border-l border-slate-200 bg-white"
          aria-label="Example code"
        >
          <div class="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
            <div class="min-w-0">
              <div class="text-sm font-medium text-slate-900">Example code</div>
              <div class="text-xs text-slate-500">Resume session</div>
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                class="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                title="Copy code"
                @click="copyShowcasedCode"
              >
                <i
                  :class="copyStatus === 'copied' ? 'fa-solid fa-check' : 'fa-regular fa-copy'"
                  aria-hidden="true"
                />
                {{ copyStatus === 'copied' ? 'Copied' : 'Copy' }}
              </button>

              <button
                type="button"
                class="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                title="Close"
                @click="isCodeSheetOpen = false"
              >
                <i class="fa-solid fa-xmark" aria-hidden="true" />
                <span class="sr-only">Close</span>
              </button>
            </div>
          </div>

          <div class="min-h-0 flex-1 overflow-auto p-4">
            <pre class="whitespace-pre-wrap break-words rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed">
<code class="font-mono" v-html="highlightedCode" />
            </pre>
          </div>
        </aside>
      </Transition>

      <div v-if="!restoredPages" class="mt-8 flex flex-1 items-center justify-center">
        <div class="inline-flex items-center gap-3 text-sm text-slate-600">
          <svg class="h-5 w-5 animate-spin text-slate-500" viewBox="0 0 24 24" aria-hidden="true">
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
          <span>Restoring session…</span>
        </div>
      </div>

      <Masonry
        v-else
        ref="masonryRef"
        v-model:items="items"
        :get-content="getContent"
        :page="initialPageToken"
        :restored-pages="restoredPages"
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

              <span class="truncate font-mono text-xs text-slate-500">
                <span v-if="getPageLabelFromId(item.id)">p{{ getPageLabelFromId(item.id) }} · </span>
                {{ item.id }}
              </span>
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
