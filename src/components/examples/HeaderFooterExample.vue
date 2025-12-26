<template>
  <Masonry
    v-model:items="items"
    :get-page="getPage"
    :load-at-page="1"
    :layout="layout"
    init="auto"
  >
    <template #item-header="{ item }">
      <div class="h-full flex items-center justify-between px-3">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm">
            <i :class="item.type === 'video' ? 'fas fa-video text-[10px] text-slate-500' : 'fas fa-image text-[10px] text-slate-500'"></i>
          </div>
          <span class="text-xs font-medium text-slate-700">#{{ String(item.id).split('-')[0] }}</span>
        </div>
        <span v-if="item.title" class="text-[11px] text-slate-600 truncate max-w-[160px]">{{ item.title }}</span>
      </div>
    </template>

    <template #item-footer="{ item, remove }">
      <div class="h-full flex items-center justify-between px-3">
        <div class="flex items-center gap-2">
          <button
            v-if="remove"
            class="px-2.5 py-1 rounded-full bg-white/90 text-slate-700 text-[11px] shadow-sm hover:bg-red-500 hover:text-white transition-colors"
            @click.stop="remove(item)"
          >
            Remove
          </button>
        </div>
        <div class="text-[11px] text-slate-600">
          {{ item.width }}×{{ item.height }}
        </div>
      </div>
    </template>
  </Masonry>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Masonry from '../../Masonry.vue'
import fixture from '../../pages.json'
import type { MasonryItem, GetPageResult } from '../../types'

const items = ref<MasonryItem[]>([])

const layout = {
  sizes: { base: 1, sm: 2, md: 3, lg: 4 },
  gutterX: 10,
  gutterY: 10,
  header: 36,
  footer: 40
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
</script>



