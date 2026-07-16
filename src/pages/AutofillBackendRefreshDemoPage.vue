<script setup lang="ts">
import AutofillDemoPage from './AutofillDemoPage.vue'
import type { VibeState } from '@/index'

defineProps<{
  infiniteScroll: boolean
}>()

const emit = defineEmits<{
  vibeStateChange: [state: VibeState]
}>()
</script>

<template>
  <AutofillDemoPage
    :infinite-scroll="infiniteScroll"
    mode="refresh"
    strategy="backend"
    @vibe-state-change="emit('vibeStateChange', $event)"
  />
</template>
