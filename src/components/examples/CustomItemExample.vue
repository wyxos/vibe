<template>
  <Masonry
    v-model:items="items"
    :get-page="getPage"
    :load-at-page="1"
    :layout="layout"
    init="auto"
  >
    <template #item="{ item, remove }">
      <div class="custom-card">
        <img v-if="item.src" :src="item.src" :alt="item.title || 'Item'" />
        <div class="overlay">
          <h3 class="text-white font-semibold text-sm mb-2">{{ item.title || 'Untitled' }}</h3>
          <button 
            @click="remove" 
            class="px-3 py-1 bg-white/20 hover:bg-white/30 border border-white/30 rounded text-white text-xs transition-colors"
          >
            Remove
          </button>
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
</script>

<style scoped>
.custom-card {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.custom-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.custom-card .overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
  padding: 16px;
}
</style>

