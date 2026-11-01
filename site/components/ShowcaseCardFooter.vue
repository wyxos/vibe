<script setup lang="ts">
import { Info, Layers } from 'lucide-vue-next'
import type { ShowcaseItem } from '../fixtures'

defineProps<{ item: ShowcaseItem; mediaCount: number }>()
defineEmits<{ info: [] }>()
</script>

<template>
  <div class="showcase-card-footer">
    <div class="showcase-card-caption">
      <strong>{{ item.title }}</strong>
      <span>{{ item.collection }}</span>
    </div>
    <span v-if="mediaCount > 1" class="showcase-card-stack" :aria-label="`${mediaCount} images`">
      <Layers :size="13" aria-hidden="true" />{{ mediaCount }}
    </span>
    <button
      class="showcase-card-info"
      type="button"
      :aria-label="`About ${item.title}`"
      :title="`About ${item.title}`"
      @click.stop="$emit('info')"
    >
      <Info :size="16" aria-hidden="true" />
    </button>
  </div>
</template>
