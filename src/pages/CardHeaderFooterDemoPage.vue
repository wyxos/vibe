<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  shallowRef,
  watch,
} from 'vue'

import DemoCardFooter from '@/demo/card-chrome/DemoCardFooter.vue'
import DemoCardHeader from '@/demo/card-chrome/DemoCardHeader.vue'
import DemoFeedFooter from '@/demo/card-chrome/DemoFeedFooter.vue'
import {
  loadCardDemoPage,
  resetCardDemoFeed,
} from '@/demo/card-chrome/cardDemoFeed'
import {
  createVibe,
  type VibeInstance,
  type VibeState,
} from '@/index'

const props = defineProps<{
  infiniteScroll: boolean
}>()

const emit = defineEmits<{
  vibeStateChange: [state: VibeState]
}>()

const vibeTarget = shallowRef<HTMLElement | null>(null)
const vibeState = shallowRef<VibeState | null>(null)
const loadMorePaused = computed(() => vibeState.value?.loadMoreLocked ?? false)
let vibe: VibeInstance | null = null

watch(() => props.infiniteScroll, (enabled) => {
  vibe?.setInfiniteScroll(enabled)
})

function toggleLoadMorePause(): void {
  vibe?.setLoadMoreLocked(!loadMorePaused.value)
}

onMounted(async () => {
  const target = vibeTarget.value
  if (!target) return

  resetCardDemoFeed()
  vibe = createVibe({
    autofill: {
      strategy: 'frontend',
      pageSize: 500,
      maxAdditionalPages: 'unlimited',
      delayStepMs: 1_500,
      delayMaxMs: 1_500,
    },
    cardFooter: {
      background: 'transparent',
      component: DemoCardFooter,
      height: 48,
    },
    cardHeader: {
      background: 'transparent',
      component: DemoCardHeader,
      height: 48,
    },
    feedFooter: {
      component: DemoFeedFooter,
    },
    target,
    layout: 'responsive',
    infiniteScroll: props.infiniteScroll,
    onStateChange: (state) => {
      vibeState.value = state
      emit('vibeStateChange', state)
    },
    loadPage: loadCardDemoPage,
  })

  await vibe.mount()
})

onBeforeUnmount(() => {
  vibe?.destroy()
  vibe = null
  resetCardDemoFeed()
})
</script>

<template>
  <section
    class="demo-stage card-chrome-demo-stage"
    aria-label="Card header and footer"
  >
    <div class="card-chrome-demo-controls">
      <p data-test="grouping-contract">
        Provider adapter: one grouped VibeItem per post. Vibe only deduplicates postId across pages.
      </p>
      <button
        type="button"
        class="demo-feed-footer-action"
        :aria-pressed="loadMorePaused"
        data-test="card-demo-pause"
        @click="toggleLoadMorePause"
      >
        {{ loadMorePaused ? 'Resume load more' : 'Pause load more' }}
      </button>
    </div>
    <div
      ref="vibeTarget"
      class="vibe-host demo-vibe-host"
      aria-label="Card header and footer demo"
    />
  </section>
</template>
