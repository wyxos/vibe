<script setup lang="ts">
import { Trash2 } from 'lucide-vue-next'
import { computed } from 'vue'

import type {
  VibeCardRegionProps,
  VibeItemId,
} from '@/index'

const props = defineProps<VibeCardRegionProps>()
const postPositionLabel = computed(() => (
  `${props.index + 1} / ${props.loadedCount}`
))

function requestRemoval(event: MouseEvent): void {
  const button = event.currentTarget as HTMLButtonElement
  button.dispatchEvent(new CustomEvent<VibeItemId>('vibe-demo-remove-item', {
    bubbles: true,
    detail: props.item.postId,
  }))
}
</script>

<template>
  <div class="demo-removal-footer">
    <span class="demo-card-metadata demo-card-post-position">
      {{ postPositionLabel }}
    </span>
    <button
      type="button"
      class="demo-card-action demo-card-action--remove"
      :aria-label="`Remove post ${item.postId}`"
      :title="`Remove post ${item.postId}`"
      data-test="card-remove"
      @click="requestRemoval"
    >
      <Trash2 :size="16" />
    </button>
  </div>
</template>
