<template>
  <Masonry
    v-model:items="items"
    :get-next-page="getPage"
    :load-at-page="1"
    :layout="layout"
  />
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

