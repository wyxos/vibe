<script setup lang="ts">
import type { Component } from 'vue'

const props = defineProps<{
  component?: Component
  label: string
  retrying: boolean
  status: string
}>()

const emit = defineEmits<{
  retry: []
}>()

function retry(): void {
  if (!props.retrying) emit('retry')
}
</script>

<template>
  <div
    data-test="media-error"
    class="media-error"
    role="group"
    :aria-busy="retrying"
    :aria-label="`${status} ${label}`"
  >
    <div
      v-if="component"
      class="media-error-component"
      @click.stop
      @keydown.stop
    >
      <component
        :is="component"
        :label="label"
        :retry="retry"
        :retrying="retrying"
        :status="status"
      />
    </div>
    <template v-else>
      <strong class="media-error-code">{{ status }}</strong>
      <span>{{ label }}</span>
      <button
        data-test="media-retry"
        class="media-error-retry"
        type="button"
        :disabled="retrying"
        @click.stop="retry"
        @keydown.stop
      >
        {{ retrying ? 'Retrying…' : 'Retry' }}
      </button>
    </template>
  </div>
</template>
