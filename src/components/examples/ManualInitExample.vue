<template>
  <div class="relative h-full">
    <div
      v-if="!isInitialized"
      class="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm"
    >
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
        @click="handleInit"
      >
        Load gallery
        <span class="text-slate-400">-></span>
      </button>
    </div>

    <Masonry
      ref="masonryRef"
      v-model:items="items"
      :get-page="getPage"
      :load-at-page="1"
      :layout="layout"
      init="manual"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Masonry from '../../Masonry.vue'
import fixture from '../../pages.json'
import type { MasonryItem, GetPageResult } from '../../types'

const items = ref<MasonryItem[]>([])
const isInitialized = ref(false)
const masonryRef = ref<InstanceType<typeof Masonry> | null>(null)

const layout = {
  sizes: { base: 1, sm: 2, md: 3, lg: 4 },
  gutterX: 10,
  gutterY: 10
}

const getPage = async (page: number): Promise<GetPageResult> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const pageData = (fixture as any[])[page - 1] as { items: MasonryItem[] } | undefined

      if (!pageData) {
        resolve({
          items: [],
          nextPage: null
        })
        return
      }

      resolve({
        items: pageData.items,
        nextPage: page < (fixture as any[]).length ? page + 1 : null
      })
    }, 300)
  })
}

function handleInit() {
  if (isInitialized.value) {
    return
  }

  isInitialized.value = true
  masonryRef.value?.loadPage(1)
}
</script>





