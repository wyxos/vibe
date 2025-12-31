<script setup>
import Masonry from './Masonry.vue'
import { fetchPage } from './fakeServer'

const initialPageToken = (() => {
  const raw = new URLSearchParams(window.location.search).get('page')
  const trimmed = raw?.trim()
  return trimmed ? trimmed : 1
})()

async function getContent(pageToken) {
  return fetchPage(pageToken)
}
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
          <p class="text-sm text-slate-600">Fake server demo · 100 pages · 20 items/page</p>
        </div>
      </header>

      <Masonry :get-content="getContent" :page="initialPageToken">
        <template #itemHeader="{ item }">
          <div class="flex items-center justify-between gap-3 px-4 pt-3">
            <span
              class="inline-flex items-center rounded-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 px-2 py-0.5 text-xs font-medium text-slate-700"
            >
              {{ item.type }}
            </span>
            <span class="truncate font-mono text-xs text-slate-500">{{ item.id }}</span>
          </div>
        </template>

        <template #itemFooter="{ item }">
          <div class="flex items-center justify-between gap-3 px-4 py-3">
            <span
              class="inline-flex items-center rounded-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 px-2 py-0.5 text-xs font-medium text-slate-700"
            >
              {{ item.type }}
            </span>
            <span class="truncate font-mono text-xs text-slate-500">{{ item.id }}</span>
          </div>
        </template>
      </Masonry>
    </div>
  </div>
</template>
