<script setup lang="ts">
import { computed } from 'vue'
import type { VibeCardRegionProps } from '@/index'
import { selectPost, selectionBusy, selectionReady, selectionRows } from './selection'

const props = defineProps<VibeCardRegionProps>()
const selected = computed(() => selectionRows.value.some((row) => row.postId === props.item.postId))
</script>

<template>
  <button
    class="selection-button"
    type="button"
    :aria-pressed="selected"
    :disabled="selectionBusy || !selectionReady"
    @click.stop="selectPost(Number(item.postId), !selected)"
  >
    {{ selected ? 'Selected' : 'Select post' }} · {{ mediaCount }} {{ mediaCount === 1 ? 'image' : 'images' }}
  </button>
</template>
