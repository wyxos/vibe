<script setup lang="ts">
defineProps<{
  hasError: boolean
  hasNext: boolean
  infiniteScroll: boolean
  isLoading: boolean
}>()

defineEmits<{
  loadMore: []
}>()
</script>

<template>
  <footer
    v-if="hasNext || isLoading || hasError"
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
      v-else-if="!infiniteScroll || hasError"
      data-test="load-more"
      class="load-more-button"
      type="button"
      @click="$emit('loadMore')"
    >
      {{ hasError ? 'Try again' : 'Load more' }}
    </button>

    <span
      v-else
      class="gallery-sentinel"
      aria-hidden="true"
    />
  </footer>
</template>
