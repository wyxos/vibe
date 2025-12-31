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
    <div class="mx-auto flex h-full min-h-0 max-w-6xl flex-col px-6 py-10">
      <header class="flex items-center gap-4">
        <img src="/logo.svg" alt="Vibe" class="h-10 w-10" />
        <div class="min-w-0">
          <h1 class="text-2xl font-semibold tracking-tight text-slate-900">Vibe</h1>
          <p class="text-sm text-slate-600">Fake server demo · 100 pages · 20 items/page</p>
        </div>
      </header>

      <Masonry :get-content="getContent" :page="initialPageToken" />
    </div>
  </div>
</template>
