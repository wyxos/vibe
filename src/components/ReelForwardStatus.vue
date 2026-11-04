<script setup lang="ts">
import { computed } from 'vue'
import type { VibeReelForwardStatus } from '../types'

const props = defineProps<{
  status: Exclude<VibeReelForwardStatus, 'idle'>
  locked: boolean
  manual: boolean
}>()
const emit = defineEmits<{ retry: [] }>()
const canContinue = computed(() => props.status === 'end' && props.manual)
const message = computed(() => {
  if (props.status === 'loading') return 'Loading the next media…'
  if (props.status === 'error') return 'Unable to load the next media.'
  return canContinue.value ? 'Load the next page to continue.' : 'You reached the end of this feed.'
})
</script>

<template>
  <div class="reel-forward-status" :role="status === 'error' ? 'alert' : 'status'" :data-status="status">
    <p>{{ message }}</p>
    <button
      v-if="status !== 'loading'"
      class="reel-forward-retry"
      type="button"
      :disabled="locked"
      @click="emit('retry')"
    >{{ canContinue ? 'Load more' : 'Retry' }}</button>
  </div>
</template>
