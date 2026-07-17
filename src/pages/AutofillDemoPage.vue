<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  shallowRef,
  watch,
} from 'vue'
import { RotateCcw, X } from 'lucide-vue-next'

import {
  AUTOFILL_DEMO_TARGET_SIZE,
  loadAutofillDemoPage,
} from '@/demo/autofillPage'
import { BackendAutofillSimulator } from '@/demo/backendAutofillSimulator'
import {
  createVibe,
  type VibeAutofillStrategy,
  type VibeInstance,
  type VibeState,
} from '@/index'

type AutofillDemoMode = 'default' | 'refresh'

const props = withDefaults(defineProps<{
  infiniteScroll: boolean
  mode?: AutofillDemoMode
  strategy: VibeAutofillStrategy
}>(), {
  mode: 'default',
})

const emit = defineEmits<{
  vibeStateChange: [state: VibeState]
}>()

const state = shallowRef<VibeState | null>(null)
const vibeTarget = shallowRef<HTMLElement | null>(null)
let simulator: BackendAutofillSimulator | null = null
let stopSimulator: (() => void) | null = null
let vibe: VibeInstance | null = null
const setupAbortController = new AbortController()

const isRefreshScenario = computed(() => props.mode === 'refresh')

const canCancel = computed(() => (
  state.value !== null
  && ['filling', 'restoring', 'waiting'].includes(state.value.autofill.status)
))

const canRestart = computed(() => (
  state.value !== null
  && state.value.autofill.status !== 'cancelling'
  && !state.value.isLoading
  && !state.value.isLoadingMore
))

function handleStateChange(nextState: VibeState): void {
  state.value = nextState
  emit('vibeStateChange', nextState)

  if (simulator && nextState.autofill.sessionId) {
    simulator.saveVisiblePage({
      items: [...nextState.items],
      next: nextState.next,
      total: nextState.total ?? undefined,
    })
  }
}

async function cancelAutofill(): Promise<void> {
  await vibe?.cancelAutofill()
}

async function restartAutofill(): Promise<void> {
  if (!vibe) return
  if (canCancel.value) await vibe.cancelAutofill()
  simulator?.clear()
  await vibe.reload()
}

async function prepareRefreshScenario(
  backendSimulator: BackendAutofillSimulator,
) {
  const initialPage = await loadAutofillDemoPage({
    cursor: null,
    signal: setupAbortController.signal,
  })
  const pageSize = 45
  const feedKey = 'demo-autofill-refresh-feed'

  backendSimulator.seedInProgress({
    cycleId: 'demo-refresh-cycle',
    feedKey,
    items: initialPage.items,
    missing: pageSize,
    next: initialPage.next,
    pageSize,
    received: 0,
    signal: setupAbortController.signal,
    total: initialPage.total ?? null,
  })

  return {
    feedKey,
    pageSize,
    restoration: backendSimulator.getRestoration(),
  }
}

watch(() => props.infiniteScroll, (enabled) => {
  vibe?.setInfiniteScroll(enabled)
})

onMounted(async () => {
  const target = vibeTarget.value
  if (!target) return

  simulator = props.strategy === 'backend'
    ? new BackendAutofillSimulator()
    : null
  simulator?.clear()
  const refreshScenario = simulator && isRefreshScenario.value
    ? await prepareRefreshScenario(simulator)
    : null
  if (setupAbortController.signal.aborted) return
  const restoration = refreshScenario?.restoration ?? null
  const backendPageSize = refreshScenario?.pageSize ?? AUTOFILL_DEMO_TARGET_SIZE
  const backendFeedKey = refreshScenario?.feedKey ?? 'demo-autofill-feed'

  vibe = createVibe({
    autofill: props.strategy === 'frontend'
      ? {
          strategy: 'frontend',
          maxAdditionalPages: 4,
          pageSize: AUTOFILL_DEMO_TARGET_SIZE,
        }
      : {
          strategy: 'backend',
          feedKey: backendFeedKey,
          initialSession: restoration?.session,
          onCancel: (context) => simulator?.cancel(context),
          onUnderfilled: (context) => {
            if (!simulator) throw new Error('Backend simulator is unavailable.')
            return simulator.start(context)
          },
          pageSize: backendPageSize,
        },
    initialPage: restoration?.initialPage,
    infiniteScroll: props.infiniteScroll,
    layout: 'responsive',
    loadPage: loadAutofillDemoPage,
    onStateChange: handleStateChange,
    target,
  })

  if (simulator) {
    stopSimulator = simulator.subscribe((update) => {
      vibe?.applyAutofillUpdate(update)
    })
    simulator.startMonitoring()
  }

  await vibe.mount()
})

onBeforeUnmount(() => {
  setupAbortController.abort()
  stopSimulator?.()
  stopSimulator = null
  simulator?.destroy()
  simulator = null
  vibe?.destroy()
  vibe = null
})
</script>

<template>
  <section
    class="autofill-demo-stage"
    :aria-label="isRefreshScenario ? 'backend autofill refresh demo' : `${strategy} autofill demo`"
  >
    <div class="autofill-demo-controls">
      <span class="autofill-demo-note">
        <template v-if="isRefreshScenario">
          Page 1 is restored with 45 cards while page 2 is in progress. Page 2
          returns 38; page 3 completes the 45-card target at 86. Refresh to replay.
        </template>
        <template v-else>
          {{ strategy === 'backend'
            ? 'The simulated backend owns the increasing request delay; Vibe mirrors its countdown.'
            : 'Vibe paces fixture requests and commits them as one completed batch.' }}
          Page 1 has 45 cards · page 2 has 38 · target
          {{ AUTOFILL_DEMO_TARGET_SIZE }} · delays increase 0s, 2s, 4s up to 10s.
        </template>
      </span>

      <div class="autofill-demo-actions">
        <button
          data-test="cancel-autofill"
          class="autofill-demo-action autofill-demo-action--cancel"
          type="button"
          :disabled="!canCancel"
          @click="cancelAutofill"
        >
          <X :size="14" aria-hidden="true" />
          Cancel
        </button>
        <button
          v-if="!isRefreshScenario"
          data-test="restart-autofill"
          class="autofill-demo-action"
          type="button"
          :disabled="!canRestart"
          @click="restartAutofill"
        >
          <RotateCcw :size="14" aria-hidden="true" />
          Restart
        </button>
      </div>
    </div>

    <div
      ref="vibeTarget"
      class="vibe-host autofill-demo-vibe"
      :aria-label="`${strategy} autofill media`"
    />
  </section>
</template>
