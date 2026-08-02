<script setup lang="ts">
import type {
  VibeFeedFooter,
  VibeFeedFooterActions,
  VibeState,
} from '../types'
import FeedFooter from './FeedFooter.vue'

const props = defineProps<{
  actions: VibeFeedFooterActions
  canRetryEnd: boolean
  feedFooter?: VibeFeedFooter
  state: VibeState
}>()

const emit = defineEmits<{
  loadMore: []
  retryEnd: []
}>()
</script>

<template>
  <main
    class="gallery-shell"
    :role="props.state.error ? 'alert' : props.state.isLoading ? 'status' : undefined"
  >
    <p class="gallery-status">
      <template v-if="props.state.error">
        Unable to load media.
      </template>
      <template v-else-if="props.state.isLoading">
        Loading media…
      </template>
      <template v-else>
        No media found.
      </template>
    </p>

    <FeedFooter
      v-if="feedFooter"
      :actions="actions"
      :can-retry-end="canRetryEnd"
      :feed-footer="feedFooter"
      :has-error="Boolean(state.nextPageError)"
      :has-next="state.next !== null"
      :is-loading="state.isLoadingMore"
      :load-more-locked="state.loadMoreLocked"
      show-load-more
      :state="state"
      @load-more="emit('loadMore')"
      @retry-end="emit('retryEnd')"
    />
  </main>
</template>
