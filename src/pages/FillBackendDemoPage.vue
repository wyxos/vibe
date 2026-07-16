<script setup lang="ts">
import FillDemoPage from './FillDemoPage.vue'
import type { VibeState } from '@/index'

defineProps<{ infiniteScroll: boolean }>()
const emit = defineEmits<{ vibeStateChange: [state: VibeState] }>()
</script>

<template>
  <FillDemoPage
    :infinite-scroll="infiniteScroll"
    strategy="backend"
    @vibe-state-change="emit('vibeStateChange', $event)"
  />
</template>
