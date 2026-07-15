<script setup lang="ts">
import { Info } from 'lucide-vue-next'
import { computed, ref } from 'vue'

import type { VibeCardRegionProps } from '@/index'

const props = defineProps<VibeCardRegionProps>()
const showDetails = ref(false)
const mediaPositionLabel = computed(() => (
  `${props.mediaIndex + 1} / ${props.mediaCount}`
))
const dimensionsLabel = computed(() => (
  `${props.mediaItem.width ?? '—'} × ${props.mediaItem.height ?? '—'}`
))
</script>

<template>
  <div class="demo-card-header-content">
    <span
      v-if="props.mediaCount > 1"
      class="demo-card-metadata demo-card-media-position"
    >
      {{ mediaPositionLabel }}
    </span>
    <span
      v-if="showDetails"
      class="demo-card-metadata demo-card-details"
    >
      {{ dimensionsLabel }}
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
