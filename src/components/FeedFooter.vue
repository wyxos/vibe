<script setup lang="ts">
import type {
  VibeFeedFooter,
  VibeFeedFooterActions,
  VibeState,
} from '../types'
import GalleryFooter from './GalleryFooter.vue'

const props = defineProps<{
  actions?: VibeFeedFooterActions
  canRetryEnd: boolean
  feedFooter?: VibeFeedFooter
  hasError: boolean
  hasNext: boolean
  infiniteScroll: boolean
  isLoading: boolean
  loadMoreLocked: boolean
  state?: VibeState
}>()

const emit = defineEmits<{
  loadMore: []
  retryEnd: []
}>()

function cancelAutofill(): void {
  void props.actions?.cancelAutofill()
}

function retry(): void {
  void props.actions?.retry()
}
</script>

<template>
  <component
    :is="feedFooter.component"
    v-if="feedFooter && actions && state"
    :actions="actions"
    :can-retry-end="canRetryEnd"
    :state="state"
    @autofill-cancel="cancelAutofill"
    @load-more="emit('loadMore')"
    @retry="retry"
    @retry-end="emit('retryEnd')"
  />

  <GalleryFooter
    v-else
    :can-retry-end="canRetryEnd"
    :has-error="hasError"
    :has-next="hasNext"
    :infinite-scroll="infiniteScroll"
    :is-loading="isLoading"
    :load-more-locked="loadMoreLocked"
    @load-more="emit('loadMore')"
    @retry-end="emit('retryEnd')"
  />
</template>
