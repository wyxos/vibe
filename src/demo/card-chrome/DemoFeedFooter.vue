<script setup lang="ts">
import { computed } from 'vue'

import { failNextCardDemoRequest } from './cardDemoFeed'
import type { VibeFeedFooterProps } from '@/index'

const props = defineProps<VibeFeedFooterProps>()
const emit = defineEmits<{
  'autofill-cancel': []
  'load-more': []
  retry: []
  'retry-end': []
}>()

const hasError = computed(() => Boolean(
  props.state.error
  || props.state.nextPageError
  || props.state.autofill.error,
))
const canCancel = computed(() => (
  props.state.autofill.enabled
  && ['filling', 'restoring', 'waiting'].includes(props.state.autofill.status)
))
const countdown = computed(() => {
  const remaining = props.state.autofill.delayRemainingMs
  return remaining === null ? null : Math.max(1, Math.ceil(remaining / 1_000))
})
const progress = computed(() => {
  const autofill = props.state.autofill
  if (!autofill.enabled || autofill.pageSize === null) return null
  return `${autofill.received} / ${autofill.pageSize}`
})
const requestCount = computed(() => {
  const count = props.state.autofill.requests
  return `${count} ${count === 1 ? 'request' : 'requests'}`
})
const statusLabel = computed(() => {
  const state = props.state
  if (hasError.value) return 'Request failed'
  if (state.autofill.status === 'cancelled') return 'Autofill cancelled'
  if (state.loadMoreLocked) return 'Load more paused'
  if (countdown.value !== null) return 'Waiting'
  if (state.isLoading || state.isLoadingMore) return 'Loading'
  if (['filling', 'restoring', 'waiting'].includes(state.autofill.status)) return 'Filling'
  if (state.next === null) return 'End of feed'
  return 'Ready'
})

function retry(): void {
  if (props.state.error) emit('retry')
  else emit('retry-end')
}

function simulateRetryError(): void {
  failNextCardDemoRequest()
  emit('retry-end')
}
</script>

<template>
  <footer
    class="demo-feed-footer"
    data-test="demo-feed-footer"
    aria-live="polite"
  >
    <div class="demo-feed-footer-status">
      <strong data-test="demo-feed-footer-status">{{ statusLabel }}</strong>
      <span v-if="progress" data-test="demo-feed-footer-progress">{{ progress }}</span>
      <span data-test="demo-feed-footer-requests">{{ requestCount }}</span>
      <span v-if="countdown !== null" data-test="demo-feed-footer-countdown">
        Next in {{ countdown }}s
      </span>
    </div>

    <div class="demo-feed-footer-actions">
      <button
        v-if="hasError"
        type="button"
        class="demo-feed-footer-action"
        data-test="demo-feed-footer-retry"
        @click="retry"
      >
        Retry
      </button>
      <button
        v-else-if="canCancel"
        type="button"
        class="demo-feed-footer-action demo-feed-footer-action--cancel"
        data-test="demo-feed-footer-cancel"
        @click="props.actions.cancelAutofill()"
      >
        Cancel
      </button>
      <button
        v-else-if="props.state.autofill.status === 'cancelled'"
        type="button"
        class="demo-feed-footer-action"
        data-test="demo-feed-footer-restart"
        @click="emit('retry')"
      >
        Restart
      </button>
      <button
        v-else-if="props.state.next !== null && !props.state.infiniteScroll"
        type="button"
        class="demo-feed-footer-action"
        data-test="demo-feed-footer-load-more"
        @click="emit('load-more')"
      >
        Load more
      </button>
      <button
        v-else-if="props.state.next === null && props.state.items.length > 0"
        type="button"
        class="demo-feed-footer-action"
        data-test="demo-feed-footer-fail-retry"
        @click="simulateRetryError"
      >
        Test retry
      </button>
    </div>
  </footer>
</template>
