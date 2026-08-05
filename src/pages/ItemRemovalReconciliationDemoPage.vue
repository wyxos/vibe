<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, shallowRef } from 'vue'
import { AlertTriangle, RotateCcw, Rows3, Trash2 } from 'lucide-vue-next'

import {
  createRemovalReconciliationDemoServer,
  RECONCILIATION_DEMO_PAGE_CURSORS,
  RECONCILIATION_DEMO_PAGE_SIZE,
  RECONCILIATION_DEMO_REMOVALS,
  type ReconciliationDemoRequest,
  type ReconciliationDemoScenario,
} from '@/demo/removalReconciliationServer'
import {
  createVibe,
  type VibeCursor,
  type VibeInstance,
  type VibeRemoval,
  type VibeState,
} from '@/index'

defineProps<{ infiniteScroll: boolean }>()

const emit = defineEmits<{
  vibeInstanceChange: [instance: VibeInstance | null]
  vibeStateChange: [state: VibeState]
}>()

const server = createRemovalReconciliationDemoServer()
const vibeTarget = shallowRef<HTMLElement | null>(null)
const state = shallowRef<VibeState | null>(null)
const requestLog = shallowRef<readonly ReconciliationDemoRequest[]>([])
const removal = shallowRef<VibeRemoval | null>(null)
const busy = shallowRef(false)
const failureArmed = shallowRef(false)
const prepared = shallowRef(false)
const status = shallowRef('Preparing the three-page variation scenario')
const reconciliationStartIds = shallowRef<readonly (string | number)[]>([])
const latestReconciliationBatch = shallowRef<number | null>(null)
let vibe: VibeInstance | null = null
let unsubscribeRequests: (() => void) | null = null

const visibleIds = computed(() => new Set(state.value?.items.map(({ postId }) => postId) ?? []))
const visibleCount = computed(() => visibleIds.value.size)
const canCheck = computed(() => prepared.value && !busy.value && state.value?.next !== null)
const canRemove = computed(() => (
  prepared.value
  && !busy.value
  && server.getScenario() === 'variation'
  && removal.value === null
))
const latestBatchRequests = computed(() => requestLog.value.filter((request) => (
  request.batch === latestReconciliationBatch.value && request.status === 'succeeded'
)))
const appendedCount = computed(() => {
  if (latestReconciliationBatch.value === null) return 0
  const before = new Set(reconciliationStartIds.value)
  return [...visibleIds.value].filter((id) => !before.has(id)).length
})

function cursorLabel(cursor: VibeCursor): string {
  return cursor === null ? 'start' : String(cursor)
}

const pageDiagnostics = computed(() => RECONCILIATION_DEMO_PAGE_CURSORS.map((cursor, index) => {
  const initialIds = server.getInitialPageIds(cursor)
  const currentIds = server.getCurrentPageIds(cursor)
  const surviving = currentIds.filter((id) => visibleIds.value.has(id))
  const replay = [...latestBatchRequests.value].reverse().find((request) => request.cursor === cursor)
  const before = new Set(reconciliationStartIds.value)
  const newIds = replay?.itemIds.filter((id) => !before.has(id)) ?? []
  return {
    capacity: RECONCILIATION_DEMO_PAGE_SIZE,
    cursor,
    label: `Page ${index + 1}`,
    needsReconciliation: surviving.length < RECONCILIATION_DEMO_PAGE_SIZE,
    newIds,
    originallyReturned: initialIds.length,
    replayCursor: replay ? cursorLabel(replay.cursor) : '—',
    surviving: surviving.length,
  }
}))

function createInstance(): VibeInstance {
  const target = vibeTarget.value
  if (!target) throw new Error('Reconciliation demo target is unavailable.')
  return createVibe({
    infiniteScroll: false,
    layout: 'masonry',
    loadPage: server.loadPage,
    removalReconciliation: {
      maxReplayPages: 5,
      pageSize: RECONCILIATION_DEMO_PAGE_SIZE,
    },
    target,
    onStateChange: (nextState) => {
      state.value = nextState
      emit('vibeStateChange', nextState)
    },
  })
}

async function prepareScenario(scenario: ReconciliationDemoScenario): Promise<void> {
  if (busy.value) return
  busy.value = true
  prepared.value = false
  removal.value = null
  latestReconciliationBatch.value = null
  reconciliationStartIds.value = []
  status.value = `Preparing three ${scenario === 'full' ? 'full' : 'variable'} provider pages`
  vibe?.destroy()
  emit('vibeInstanceChange', null)
  server.reset(scenario)
  server.beginBatch('initial')
  vibe = createInstance()
  emit('vibeInstanceChange', vibe)
  try {
    await vibe.mount()
    await vibe.loadNext()
    await vibe.loadNext()
    prepared.value = true
    status.value = scenario === 'full'
      ? 'Three full pages are ready; Load more will go directly to p4'
      : 'Three pages are ready; Page 2 is already short at 18/20'
  } catch {
    status.value = 'Scenario preparation failed; reset it to retry'
  } finally {
    busy.value = false
  }
}

async function removeAndPublish(): Promise<void> {
  if (!vibe || !canRemove.value) return
  busy.value = true
  try {
    removal.value = await vibe.removeItems(RECONCILIATION_DEMO_REMOVALS)
    server.publishResults()
    status.value = 'Nine reacted cards removed; the provider now exposes twenty new identities'
  } finally {
    busy.value = false
  }
}

function armFailure(): void {
  failureArmed.value = !failureArmed.value
  status.value = failureArmed.value
    ? 'The next replay request will fail once without advancing the cursor'
    : 'Simulated provider failure cancelled'
}

async function checkAndLoad(): Promise<void> {
  if (!vibe || !canCheck.value) return
  busy.value = true
  reconciliationStartIds.value = state.value?.items.map(({ postId }) => postId) ?? []
  latestReconciliationBatch.value = server.beginBatch(
    pageDiagnostics.value.some(({ needsReconciliation }) => needsReconciliation)
      ? 'reconcile'
      : 'direct',
  )
  if (failureArmed.value) {
    server.failNextRequest()
    failureArmed.value = false
  }

  try {
    await vibe.loadNext()
    if (vibe.getState().nextPageError) {
      status.value = 'Replay failed; cards, page ledger, and continuation cursor are unchanged'
      return
    }
    const replayRequests = latestBatchRequests.value.filter(({ cursor }) => (
      RECONCILIATION_DEMO_PAGE_CURSORS.includes(cursor as never)
    ))
    const before = new Set(reconciliationStartIds.value)
    const replayNew = new Set(replayRequests.flatMap(({ itemIds }) => (
      itemIds.filter((id) => !before.has(id))
    )))
    status.value = replayRequests.length === 0
      ? `All pages were full; loaded ${appendedCount.value} items directly from the next cursor`
      : `Replay found ${replayNew.size} new identities, then next-page loading appended ${appendedCount.value} total`
  } catch {
    status.value = 'Replay failed; cards, page ledger, and continuation cursor are unchanged'
  } finally {
    busy.value = false
  }
}

function undoRemoval(): void {
  if (!vibe || !removal.value || busy.value) return
  const restored = vibe.restoreRemoval(removal.value)
  status.value = restored
    ? 'Undo restored the nine cards without evicting appended replacements'
    : 'The removal could not be restored'
  if (restored) removal.value = null
}

onMounted(async () => {
  unsubscribeRequests = server.subscribe((requests) => {
    requestLog.value = [...requests]
  })
  await prepareScenario('variation')
})

onBeforeUnmount(() => {
  unsubscribeRequests?.()
  emit('vibeInstanceChange', null)
  vibe?.destroy()
  vibe = null
})
</script>

<template>
  <section class="reconciliation-demo-stage" aria-label="Capacity-aware page reconciliation">
    <header class="reconciliation-demo-toolbar">
      <div class="reconciliation-demo-summary">
        <strong>Capacity-aware reconciliation · 20 items per provider page</strong>
        <span role="status" data-test="reconciliation-status">{{ status }}</span>
      </div>
      <div class="reconciliation-demo-actions">
        <button class="reconciliation-demo-action" type="button" :disabled="busy" data-test="prepare-full" @click="prepareScenario('full')">
          <Rows3 :size="14" aria-hidden="true" /> Full branch
        </button>
        <button class="reconciliation-demo-action" type="button" :disabled="busy" data-test="prepare-variation" @click="prepareScenario('variation')">
          <Rows3 :size="14" aria-hidden="true" /> Variation branch
        </button>
        <button class="reconciliation-demo-action reconciliation-demo-action--remove" type="button" :disabled="!canRemove" data-test="remove-reconciliation-items" @click="removeAndPublish">
          <Trash2 :size="14" aria-hidden="true" /> React &amp; publish
        </button>
        <button class="reconciliation-demo-action" type="button" :disabled="busy || !prepared" :aria-pressed="failureArmed" data-test="arm-reconciliation-failure" @click="armFailure">
          <AlertTriangle :size="14" aria-hidden="true" /> {{ failureArmed ? 'Failure armed' : 'Fail next' }}
        </button>
        <button class="reconciliation-demo-action reconciliation-demo-action--primary" type="button" :disabled="!canCheck" data-test="run-reconciliation" @click="checkAndLoad">
          Check &amp; load more
        </button>
        <button class="reconciliation-demo-action" type="button" :disabled="busy || removal === null" data-test="undo-reconciliation-removal" @click="undoRemoval">
          <RotateCcw :size="14" aria-hidden="true" /> Undo
        </button>
      </div>
    </header>

    <div class="reconciliation-demo-workspace">
      <div ref="vibeTarget" class="vibe-host reconciliation-demo-vibe" aria-label="Reconciliation media feed" />

      <aside class="reconciliation-demo-inspector" aria-label="Reconciliation diagnostics">
        <dl class="reconciliation-demo-metrics">
          <div><dt>Visible</dt><dd data-test="reconciliation-visible-count">{{ visibleCount }}</dd></div>
          <div><dt>Requests</dt><dd data-test="reconciliation-request-count">{{ requestLog.length }}</dd></div>
          <div><dt>Appended</dt><dd data-test="reconciliation-appended-count">{{ appendedCount }}</dd></div>
          <div><dt>Dataset</dt><dd>{{ server.getScenario() }} / {{ server.getDataset() }}</dd></div>
        </dl>

        <section class="reconciliation-demo-window" aria-labelledby="page-diagnostics-title">
          <h2 id="page-diagnostics-title">Provider page ledger</h2>
          <div class="reconciliation-demo-pages">
            <article v-for="page in pageDiagnostics" :key="page.label" :class="{ 'reconciliation-demo-page--underfilled': page.needsReconciliation }">
              <header><strong>{{ page.label }}</strong><code>{{ cursorLabel(page.cursor) }}</code></header>
              <dl>
                <div><dt>Capacity</dt><dd>{{ page.capacity }}</dd></div>
                <div><dt>Originally returned</dt><dd>{{ page.originallyReturned }}</dd></div>
                <div><dt>Currently surviving</dt><dd>{{ page.surviving }}</dd></div>
                <div><dt>Needs replay</dt><dd>{{ page.needsReconciliation ? 'Yes' : 'No' }}</dd></div>
                <div><dt>Replay cursor</dt><dd>{{ page.replayCursor }}</dd></div>
              </dl>
              <small>New identities: {{ page.newIds.length ? page.newIds.join(', ') : 'none' }}</small>
            </article>
          </div>
        </section>

        <section class="reconciliation-demo-log" aria-labelledby="request-log-title">
          <h2 id="request-log-title">Request order</h2>
          <ol aria-live="polite">
            <li v-for="request in requestLog" :key="request.id" :class="`reconciliation-demo-request--${request.status}`">
              <span>#{{ request.id }} · {{ request.phase }} · batch {{ request.batch }}</span>
              <code>{{ cursorLabel(request.cursor) }} → {{ request.next ?? 'end' }}</code>
              <small>{{ request.status }}<template v-if="request.itemIds.length"> · {{ request.itemIds.length }} returned</template></small>
            </li>
          </ol>
        </section>
      </aside>
    </div>
  </section>
</template>
