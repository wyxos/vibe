<script setup lang="ts">
const props = defineProps<{
  canRetryEnd: boolean
  hasError: boolean
  hasNext: boolean
  isLoading: boolean
  loadMoreLocked: boolean
}>()

const emit = defineEmits<{
  loadMore: []
  retryEnd: []
}>()

function onAction(): void {
  if (props.loadMoreLocked) return
  if (props.hasNext) emit('loadMore')
  else emit('retryEnd')
}
</script>

<template>
  <footer
    v-if="hasNext || isLoading || hasError || canRetryEnd"
    class="gallery-footer"
  >
    <p
      v-if="isLoading"
      class="load-more-status"
      role="status"
    >
      Loading more…
    </p>

    <button
      v-else-if="hasError || hasNext"
      data-test="load-more"
      class="load-more-button"
      type="button"
      :disabled="loadMoreLocked"
      @click="onAction"
    >
      {{ hasError ? 'Try again' : loadMoreLocked ? 'Loading paused' : 'Load more' }}
    </button>

    <div
      v-else
      class="end-feed"
    >
      <p
        class="end-feed-message"
        role="status"
      >
        You've reached the end.
      </p>
      <button
        data-test="retry-end"
        class="load-more-button"
        type="button"
        :disabled="loadMoreLocked"
        @click="$emit('retryEnd')"
      >
        Check for more
      </button>
    </div>
  </footer>
</template>
