<script setup lang="ts">
import { Info } from 'lucide-vue-next'
import { ref } from 'vue'

import type { VibeCardRegionProps } from '@/index'

const props = defineProps<VibeCardRegionProps>()
const showDetails = ref(false)
</script>

<template>
  <div class="demo-card-header-content">
    <span
      v-if="showDetails"
      class="demo-card-metadata"
      role="status"
    >
      {{ props.index + 1 }} / {{ props.total ?? props.loadedCount }}
      · {{ props.item.width ?? '—' }} × {{ props.item.height ?? '—' }}
    </span>

    <button
      type="button"
      class="demo-card-action"
      :aria-expanded="showDetails"
      :aria-label="`Show information for post ${props.item.postId}`"
      title="Media information"
      @click="showDetails = !showDetails"
    >
      <Info :size="16" />
    </button>
  </div>
</template>
