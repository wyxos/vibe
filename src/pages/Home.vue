<script setup lang="ts">
import { computed, ref } from 'vue'

import { type FeedItem, fetchPage, type PageToken } from '@/demo/fakeServer'
import Masonry from '@/components/Masonry.vue'
import MasonryItem from '@/components/MasonryItem.vue'
import {
  buildPagesLoadedLabel,
  getInitialPageToken,
  setReaction,
  useExposeDebugRef,
} from '@/demo/demoUtils'

const items = ref<FeedItem[]>([])
const masonryRef = ref<{
  remove: (itemsOrIds: Array<string | FeedItem> | string | FeedItem) => Promise<void>
} | null>(null)

useExposeDebugRef(masonryRef)

const initialPageToken = getInitialPageToken('page', 1)

const isCodeSheetOpen = ref(false)

const showcasedCode = `<script setup lang="ts">
import { computed, ref } from 'vue'

import { type FeedItem, fetchPage, type PageToken } from '@/demo/fakeServer'
import Masonry from '@/components/Masonry.vue'
import MasonryItem from '@/components/MasonryItem.vue'
import {
  buildPagesLoadedLabel,
  getInitialPageToken,
  setReaction,
  useExposeDebugRef,
} from '@/demo/demoUtils'

const items = ref<FeedItem[]>([])
const masonryRef = ref<{
  remove: (itemsOrIds: Array<string | FeedItem> | string | FeedItem) => Promise<void>
} | null>(null)

useExposeDebugRef(masonryRef)

const initialPageToken = getInitialPageToken('page', 1)

async function getContent(pageToken: PageToken) {
  return fetchPage(pageToken)
}
</scr${'ipt'}>

<template>
  <Masonry
    ref="masonryRef"
    v-model:items="items"
    :get-content="getContent"
    :page="initialPageToken"
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
</template>
`

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function highlightVueSnippet(source: string): string {
  const escaped = escapeHtml(source)

  // Minimal highlighting for Vue template-ish code using Tailwind tokens.
  const withMustache = escaped.replaceAll(
    /\{\{([\s\S]*?)\}\}/g,
    '<span class="text-violet-700">{{</span><span class="text-slate-900">$1</span><span class="text-violet-700">}}</span>'
  )

  const withStrings = withMustache.replaceAll(
    /(&quot;[\s\S]*?&quot;|&#39;[\s\S]*?&#39;)/g,
    '<span class="text-emerald-700">$1</span>'
  )

  const withTags = withStrings.replaceAll(
    /(&lt;\/?)([A-Za-z][A-Za-z0-9-]*)([\s\S]*?)(&gt;)/g,
    (_m, p1, tag, rest, p4) => {
      const highlightedRest = String(rest)
        .replaceAll(/\s(v-[a-zA-Z0-9-]+|:[a-zA-Z0-9-]+|@[a-zA-Z0-9-]+|#[a-zA-Z0-9-]+)/g, ' <span class="text-blue-700">$1</span>')
        .replaceAll(/\s([a-zA-Z_:][a-zA-Z0-9_:\-.]*)(=)/g, ' <span class="text-blue-700">$1</span>$2')

      return `<span class="text-slate-500">${p1}</span><span class="text-cyan-700">${tag}</span>${highlightedRest}<span class="text-slate-500">${p4}</span>`
    }
  )

  return withTags
}

const highlightedCode = computed(() => highlightVueSnippet(showcasedCode))

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

const pagesLoadedLabel = computed(() => {
  return buildPagesLoadedLabel(items.value, getPageLabelFromId)
})

async function getContent(pageToken: PageToken) {
  return fetchPage(pageToken)
}

function removeRandomItems() {
  const list = items.value
  if (!Array.isArray(list) || list.length === 0) return

  const max = Math.min(5, list.length)
  const count = Math.max(1, Math.floor(Math.random() * max) + 1)
  const picked = new Set<string>()

  while (picked.size < count) {
    const idx = Math.floor(Math.random() * list.length)
    const id = list[idx]?.id
    if (id) picked.add(id)
    else break
  }

  if (!picked.size) return
  void masonryRef.value?.remove(Array.from(picked))
}
</script>

<template>
  <div class="h-full min-h-0 overflow-hidden">
    <div
      class="mx-auto flex h-full min-h-0 max-w-7xl flex-col px-6 py-10 2xl:max-w-screen-2xl 2xl:px-10 min-[1920px]:!max-w-[1800px] min-[1920px]:!px-12 min-[2560px]:!max-w-[2200px]"
    >
      <header class="flex items-center gap-4">
        <div class="min-w-0">
          <h1 class="text-2xl font-semibold tracking-tight text-slate-900">Demo</h1>
          <p class="text-sm text-slate-600">
            Fake server demo · 100 pages · 20 items/page
          </p>
        </div>

        <div class="ml-auto flex items-center gap-2">
          <span
            class="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700"
          >
            <span class="text-slate-600">Pages loaded:</span>
            <span data-testid="pages-loaded" class="ml-2 tabular-nums text-slate-900">{{ pagesLoadedLabel }}</span>
          </span>
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            @click="(masonryRef as any)?.undo?.()"
          >
            Undo last remove
          </button>
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            title="Show code"
            :aria-pressed="isCodeSheetOpen"
            @click="isCodeSheetOpen = !isCodeSheetOpen"
          >
            <i class="fa-solid fa-code" aria-hidden="true" />
            <span class="sr-only">Show code</span>
          </button>
          <button
            type="button"
            data-testid="remove-random"
            class="inline-flex items-center justify-center rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
            @click="removeRandomItems"
          >
            Remove random
          </button>
        </div>
      </header>

      <aside
        v-if="isCodeSheetOpen"
        class="fixed right-0 top-0 z-50 flex h-full w-[520px] max-w-[90vw] flex-col border-l border-slate-200 bg-white"
        aria-label="Example code"
      >
        <div class="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div class="min-w-0">
            <div class="text-sm font-medium text-slate-900">Example code</div>
            <div class="text-xs text-slate-500">Home demo</div>
          </div>

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

        <div class="min-h-0 flex-1 overflow-auto p-4">
          <pre class="overflow-auto rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed">
<code class="font-mono" v-html="highlightedCode" />
          </pre>
        </div>
      </aside>

      <Masonry
        ref="masonryRef"
        v-model:items="items"
        :get-content="getContent"
        :page="initialPageToken"
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
