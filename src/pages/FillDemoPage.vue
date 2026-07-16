<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import { ListPlus, RotateCcw, SkipForward, X } from 'lucide-vue-next'

import { BackendFillSimulator } from '@/demo/backendFillSimulator'
import { FILL_DEMO_DEFAULT_PAGES, loadFillDemoPage } from '@/demo/fillPage'
import {
  createVibe,
  type VibeFillStrategy,
  type VibeInstance,
  type VibeState,
} from '@/index'

const props = defineProps<{
  infiniteScroll: boolean
  strategy: VibeFillStrategy
}>()

const emit = defineEmits<{
  vibeStateChange: [state: VibeState]
}>()

const pageCount = ref(FILL_DEMO_DEFAULT_PAGES)
const state = shallowRef<VibeState | null>(null)
const vibeTarget = shallowRef<HTMLElement | null>(null)
let simulator: BackendFillSimulator | null = null
let stopSimulator: (() => void) | null = null
let vibe: VibeInstance | null = null

const isActive = computed(() => (
  state.value !== null
  && ['filling', 'restoring', 'waiting'].includes(state.value.fill.status)
))

const canStart = computed(() => (
  state.value !== null
  && !isActive.value
  && !state.value.isLoading
  && !state.value.isLoadingMore
  && state.value.next !== null
))

const canFillPages = computed(() => (
  canStart.value
  && Number.isInteger(pageCount.value)
  && pageCount.value > 0
))

function handleStateChange(nextState: VibeState): void {
  state.value = nextState
  emit('vibeStateChange', nextState)
}

async function fillPages(): Promise<void> {
  await vibe?.fill({ pages: pageCount.value })
}

async function fillToEnd(): Promise<void> {
  await vibe?.fill({ until: 'end' })
}

async function cancelFill(): Promise<void> {
  await vibe?.cancelFill()
}

async function resetDemo(): Promise<void> {
  if (!vibe) return
  if (isActive.value) await vibe.cancelFill()
  simulator?.reset()
  await vibe.reload()
}

watch(() => props.infiniteScroll, (enabled) => {
  vibe?.setInfiniteScroll(enabled)
})

onMounted(async () => {
  const target = vibeTarget.value
  if (!target) return

  simulator = props.strategy === 'backend' ? new BackendFillSimulator() : null
  vibe = createVibe({
    fill: props.strategy === 'frontend'
      ? { strategy: 'frontend' }
      : {
          strategy: 'backend',
          feedKey: 'demo-fill-feed',
          onCancel: (context) => simulator?.cancel(context),
          onStart: (context) => {
            if (!simulator) throw new Error('Backend simulator is unavailable.')
            return simulator.start(context)
          },
        },
    infiniteScroll: props.infiniteScroll,
    layout: 'responsive',
    loadPage: loadFillDemoPage,
    onStateChange: handleStateChange,
    target,
  })

  if (simulator) {
    stopSimulator = simulator.subscribe((update) => {
      vibe?.applyFillUpdate(update)
    })
  }
  await vibe.mount()
})

onBeforeUnmount(() => {
  stopSimulator?.()
  stopSimulator = null
  simulator?.destroy()
  simulator = null
  vibe?.destroy()
  vibe = null
})
</script>

<template>
  <section class="fill-demo-stage" :aria-label="`${strategy} fill demo`">
    <div class="fill-demo-controls">
      <span class="fill-demo-note">
        {{ strategy === 'backend'
          ? 'A simulated backend job follows the feed cursor and emits progress after each response.'
          : 'Vibe follows the feed cursor in the browser and commits the collected pages as one batch.' }}
      </span>

      <div class="fill-demo-actions">
        <label class="fill-demo-page-field">
          <span>Pages</span>
          <input
            v-model.number="pageCount"
            data-test="fill-page-count"
            type="number"
            min="1"
            max="9"
          >
        </label>
        <button
          data-test="fill-pages"
          class="fill-demo-action"
          type="button"
          :disabled="!canFillPages"
          @click="fillPages"
        >
          <ListPlus :size="14" aria-hidden="true" />
          Fill pages
        </button>
        <button
          data-test="fill-to-end"
          class="fill-demo-action"
          type="button"
          :disabled="!canStart"
          @click="fillToEnd"
        >
          <SkipForward :size="14" aria-hidden="true" />
          Fill to end
        </button>
        <button
          data-test="cancel-fill"
          class="fill-demo-action fill-demo-action--cancel"
          type="button"
          :disabled="!isActive"
          @click="cancelFill"
        >
          <X :size="14" aria-hidden="true" />
          Cancel
        </button>
        <button
          data-test="reset-fill"
          class="fill-demo-action"
          type="button"
          :disabled="state?.isLoading || state?.isLoadingMore"
          @click="resetDemo"
        >
          <RotateCcw :size="14" aria-hidden="true" />
          Reset
        </button>
      </div>
    </div>

    <div
      ref="vibeTarget"
      class="vibe-host fill-demo-vibe"
      :aria-label="`${strategy} fill media`"
    />
  </section>
</template>
