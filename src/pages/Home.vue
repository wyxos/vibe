<script setup>
import { ref, shallowRef, watch } from 'vue'

import pkg from '../../package.json'

import Masonry from '../Masonry.vue'
import { fetchPage } from '../fakeServer'

const items = ref([])
const itemIndexById = shallowRef(new Map())

const packageVersion = pkg.version

const initialPageToken = (() => {
  const raw = new URLSearchParams(window.location.search).get('page')
  const trimmed = raw?.trim()
  return trimmed ? trimmed : 1
})()

async function getContent(pageToken) {
  return fetchPage(pageToken)
}

function setReaction(itemId, reaction) {
  // Performance note: this demo is meant to stay responsive even with very large
  // item arrays (e.g. 10k). Keep reaction updates O(1) by mutating only the
  // affected item, and avoid copying the full array.
  const index = itemIndexById.value.get(itemId)
  if (index == null) return

  const it = items.value[index]
  if (!it) return
  if (it.reaction === reaction) return
  it.reaction = reaction
}

watch(
  items,
  (next) => {
    const map = new Map()
    for (let i = 0; i < next.length; i += 1) {
      const id = next[i]?.id
      if (id) map.set(id, i)
    }
    itemIndexById.value = map
  },
  { immediate: true },
)
</script>

<template>
  <div class="h-full min-h-0">
    <div
      class="mx-auto flex h-full min-h-0 max-w-7xl flex-col px-6 py-10 2xl:max-w-screen-2xl 2xl:px-10 min-[1920px]:!max-w-[1800px] min-[1920px]:!px-12 min-[2560px]:!max-w-[2200px]"
    >
      <header class="flex items-center gap-4">
        <img src="/logo.svg" alt="Vibe" class="h-10 w-10" />
        <div class="min-w-0">
          <h1 class="text-2xl font-semibold tracking-tight text-slate-900">Vibe</h1>
          <p class="text-sm text-slate-600">
            v{{ packageVersion }} · Fake server demo · 100 pages · 20 items/page
          </p>
        </div>
      </header>

      <Masonry v-model:items="items" :get-content="getContent" :page="initialPageToken">
        <template #itemFooter="{ item, remove }">
          <div class="flex items-center justify-between gap-3 px-4 py-3">
            <div class="flex min-w-0 items-center gap-2">
              <span
                class="inline-flex items-center rounded-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 px-2 py-0.5 text-xs font-medium text-slate-700"
              >
                {{ item.type }}
              </span>
              <span class="truncate font-mono text-xs text-slate-500">{{ item.id }}</span>
            </div>

            <div class="flex items-center gap-2">
              <button
                type="button"
                class="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium hover:bg-slate-50"
                :class="item.reaction === 'love' ? 'bg-slate-100 text-slate-900' : 'text-slate-700'"
                :aria-pressed="item.reaction === 'love'"
                title="Love"
                @click="setReaction(item.id, 'love')"
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
                @click="setReaction(item.id, 'like')"
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
                @click="setReaction(item.id, 'dislike')"
              >
                <i
                  :class="item.reaction === 'dislike' ? 'fa-solid fa-thumbs-down' : 'fa-regular fa-thumbs-down'"
                  aria-hidden="true"
                />
                <span class="sr-only">Dislike</span>
              </button>

              <button
                type="button"
                class="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                @click="remove()"
              >
                Remove
              </button>
            </div>
          </div>
        </template>
      </Masonry>
    </div>
  </div>
</template>
