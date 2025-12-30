<script setup>
import { onMounted, ref } from 'vue'
import { fetchPage } from './fakeServer'

const isLoading = ref(true)
const error = ref('')
const pageData = ref(null)

onMounted(async () => {
  try {
    isLoading.value = true
    error.value = ''
    pageData.value = await fetchPage(1)
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    isLoading.value = false
  }
})
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

      <section
        class="mt-8 flex min-h-0 flex-1 flex-col rounded-2xl border border-slate-200/70 bg-white/70 p-5 shadow-sm backdrop-blur"
      >
        <div class="flex items-baseline justify-between gap-4">
          <h2 class="text-base font-medium text-slate-900">Page 1</h2>
          <p v-if="pageData" class="text-xs text-slate-600">
            Showing {{ pageData.items.length }} items
          </p>
        </div>

        <div class="mt-4 min-h-0 flex-1 overflow-auto">
          <p v-if="isLoading" class="text-sm text-slate-600">Loading page 1…</p>
          <p v-else-if="error" class="text-sm font-medium text-red-700">Error: {{ error }}</p>

          <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <article
              v-for="item in pageData.items"
              :key="item.id"
              class="overflow-hidden rounded-xl border border-slate-200/60 bg-white shadow-sm"
            >
              <div class="aspect-[4/3] bg-slate-100">
                <img
                  v-if="item.type === 'image'"
                  class="h-full w-full object-cover"
                  :src="item.src"
                  :width="item.width"
                  :height="item.height"
                  loading="lazy"
                  :alt="item.id"
                />

                <video
                  v-else
                  class="h-full w-full object-cover"
                  :poster="item.poster"
                  controls
                  preload="metadata"
                >
                  <source :src="item.src" type="video/mp4" />
                </video>
              </div>

              <div class="flex items-center justify-between gap-3 px-4 py-3">
                <span
                  class="inline-flex items-center rounded-full bg-gradient-to-r from-blue-500/10 to-cyan-500/10 px-2 py-0.5 text-xs font-medium text-slate-700"
                >
                  {{ item.type }}
                </span>
                <span class="truncate font-mono text-xs text-slate-500">{{ item.id }}</span>
              </div>
            </article>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
