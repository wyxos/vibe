<script setup lang="ts">
import {
  Bookmark,
  Heart,
  ThumbsUp,
} from 'lucide-vue-next'
import { ref } from 'vue'

import type { VibeCardRegionProps } from '@/index'

defineProps<VibeCardRegionProps>()

const activeReaction = ref<string | null>(null)
const reactions = [
  { icon: Heart, label: 'Love', value: 'love' },
  { icon: ThumbsUp, label: 'Like', value: 'like' },
  { icon: Bookmark, label: 'Save', value: 'save' },
]

function toggleReaction(reaction: string): void {
  activeReaction.value = activeReaction.value === reaction ? null : reaction
}
</script>

<template>
  <div class="demo-card-reactions" aria-label="Media reactions">
    <button
      v-for="reaction in reactions"
      :key="reaction.value"
      type="button"
      class="demo-card-action"
      :class="{ 'demo-card-action--active': activeReaction === reaction.value }"
      :aria-label="reaction.label"
      :aria-pressed="activeReaction === reaction.value"
      :title="reaction.label"
      @click="toggleReaction(reaction.value)"
    >
      <component :is="reaction.icon" :size="16" />
    </button>
  </div>
</template>
