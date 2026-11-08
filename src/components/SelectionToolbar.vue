<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, shallowRef, watch } from 'vue'
import { X } from 'lucide-vue-next'
import type { VibeItemId } from '../types'
import type { VibeReorderPosition } from '../selection'
import { useSelectionContext } from './useSelectionContext'

const context = useSelectionContext()
const controller = context?.controller
const state = controller?.state
const dialog = shallowRef<HTMLDialogElement | null>(null)
const panel = shallowRef<'review' | 'actions' | 'move'>('review')
const search = shallowRef('')
const page = shallowRef(0)
const destination = shallowRef<VibeItemId | null>(null)
const position = shallowRef<VibeReorderPosition>('before')
const panelOpen = shallowRef(false)
const closing = shallowRef(false)
let returnFocus: HTMLElement | null = null
let panelAnimation: Animation | null = null
let panelGeneration = 0
const PAGE_SIZE = 50
const actions = computed(() => controller?.selectionOptions.actions ?? [])
const here = computed(() => {
  const visible = new Set(context?.visibleIds.value.map(String))
  return state?.selectedIds.filter((id) => visible.has(String(id))).length ?? 0
})
const offscreen = computed(() => Math.max(0, (state?.count ?? 0) - here.value))
const title = computed(() => panel.value === 'review' ? 'Selected items' : panel.value === 'move' ? 'Move items' : 'Selection actions')
const moveIds = computed(() => {
  void state?.selectedIds
  return context?.moveSource.value !== null && context?.moveSource.value !== undefined
    ? controller?.getMoveIds(context.moveSource.value) ?? [] : []
})
const candidates = computed(() => {
  const ids = panel.value === 'review' ? state?.selectedIds ?? [] : controller?.getItems().map((item) => item.postId) ?? []
  const moved = new Set(moveIds.value.map(String))
  const query = search.value.trim().toLocaleLowerCase()
  return ids.filter((id) => (panel.value !== 'move' || !moved.has(String(id)))
    && (!query || controller?.getLabel(id).toLocaleLowerCase().includes(query)))
})
const rows = computed(() => candidates.value.slice(page.value * PAGE_SIZE, (page.value + 1) * PAGE_SIZE))
const pages = computed(() => Math.max(1, Math.ceil(candidates.value.length / PAGE_SIZE)))

function reducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function animatePanel(entering: boolean): Promise<unknown> {
  panelAnimation?.cancel()
  if (!dialog.value?.animate || reducedMotion()) return Promise.resolve()
  const frames = [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }]
  panelAnimation = dialog.value.animate(entering ? frames : [...frames].reverse(), { duration: 140, easing: 'ease-out' })
  return panelAnimation.finished.catch(() => {})
}

async function openPanel(value: typeof panel.value): Promise<void> {
  const generation = ++panelGeneration
  closing.value = false
  panel.value = value
  search.value = ''
  page.value = 0
  destination.value = null
  position.value = 'before'
  returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
  panelOpen.value = true
  await nextTick()
  if (generation !== panelGeneration) return
  if (!dialog.value?.open) dialog.value?.showModal()
  void animatePanel(true)
}

async function closePanel(): Promise<void> {
  if (closing.value || !panelOpen.value) return
  const generation = ++panelGeneration
  closing.value = true
  await animatePanel(false)
  if (generation !== panelGeneration) return
  dialog.value?.close()
  panelOpen.value = false
  closing.value = false
  if (context) context.moveSource.value = null
  returnFocus?.focus({ preventScroll: true })
  returnFocus = null
}

function operationOrigin(): number | null {
  return panelOpen.value && !closing.value ? panelGeneration : null
}

async function closeOrigin(generation: number | null): Promise<void> {
  if (generation !== null && generation === panelGeneration) await closePanel()
}

async function move(): Promise<void> {
  const source = context?.moveSource.value
  if (source === null || source === undefined || destination.value === null || !controller) return
  const origin = operationOrigin()
  if (await controller.reorder(source, destination.value, position.value)) await closeOrigin(origin)
}

async function runAction(id: string): Promise<void> {
  const origin = operationOrigin()
  if (await controller?.runAction(id)) await closeOrigin(origin)
}

async function retryOperation(): Promise<void> {
  const origin = operationOrigin()
  if (await controller?.retry()) await closeOrigin(origin)
}

watch(search, () => { page.value = 0 })
watch(pages, (count) => { page.value = Math.min(page.value, count - 1) })
watch(() => context?.moveSource.value, (source) => {
  if (source !== null && source !== undefined) void openPanel('move')
})
onBeforeUnmount(() => {
  panelGeneration++
  panelAnimation?.cancel()
  dialog.value?.close()
})
</script>

<template>
  <div v-if="controller && state && (controller.enabled || controller.canArrange)" class="vibe-selection-toolbar">
    <div class="vibe-selection-toolbar-main" role="toolbar" aria-label="Selection and ordering">
      <div v-if="state.count" class="vibe-selection-summary" role="status" aria-live="polite" aria-atomic="true">
        <strong>{{ state.count }} selected</strong>
        <span>{{ here }} here · {{ offscreen }} off-screen</span>
      </div>
      <button v-if="controller.enabled && state.mode === 'browse'" type="button" class="vibe-selection-button" :disabled="state.busy" @click="controller.setMode('select')">Select items</button>
      <button v-if="controller.canArrange && state.mode !== 'arrange'" type="button" class="vibe-selection-button" :disabled="state.busy" @click="controller.setMode('arrange')">Arrange items</button>
      <button v-if="state.count" type="button" class="vibe-selection-button vibe-selection-review" @click="openPanel('review')">Review selection</button>
      <div v-if="state.count && actions.length" class="vibe-selection-desktop-actions">
        <button v-for="action in actions" :key="action.id" type="button" class="vibe-selection-button vibe-selection-primary" :disabled="state.busy" @click="runAction(action.id)">{{ action.label }}</button>
      </div>
      <button v-if="state.count && actions.length" type="button" class="vibe-selection-button vibe-selection-primary vibe-selection-phone-actions" :disabled="state.busy" @click="openPanel('actions')">Actions</button>
      <button v-if="state.count" type="button" class="vibe-selection-button" aria-label="Clear selection" :disabled="state.busy" @click="controller.clear()">Clear</button>
      <button v-if="state.mode !== 'browse'" type="button" class="vibe-selection-button" :disabled="state.busy" @click="controller.setMode('browse')">Done</button>
    </div>
    <div v-if="state.busy || state.error" class="vibe-selection-operation" :role="state.error ? 'alert' : 'status'" aria-live="polite">
      <span>{{ state.error || 'Working on your selection…' }}</span>
      <button v-if="state.error" type="button" class="vibe-selection-button" @click="retryOperation">Retry operation</button>
      <button v-if="state.busy" type="button" class="vibe-selection-button" @click="controller.cancel()">Cancel operation</button>
    </div>

    <dialog ref="dialog" class="vibe-selection-dialog" :aria-label="title" @cancel.prevent="closePanel" @click="($event.target === dialog) && closePanel()">
      <div class="vibe-selection-panel">
        <header class="vibe-selection-panel-header">
          <h2>{{ title }}<span v-if="panel === 'review'"> ({{ state.count }})</span></h2>
          <button type="button" class="vibe-selection-icon" aria-label="Close selection panel" @click="closePanel"><X :size="20" aria-hidden="true" /></button>
        </header>
        <div v-if="panel === 'move'" class="vibe-selection-panel-intro">Move {{ moveIds.length }} {{ moveIds.length === 1 ? 'item' : 'items' }}, including selected items off-screen.</div>
        <div v-if="panel !== 'actions'" class="vibe-selection-panel-search">
          <input v-model="search" type="search" :aria-label="panel === 'move' ? 'Find destination' : 'Find selected item'" :placeholder="panel === 'move' ? 'Find destination' : 'Find selected item'">
        </div>
        <div class="vibe-selection-panel-body">
          <template v-if="panel === 'actions'">
            <button v-for="action in actions" :key="action.id" type="button" class="vibe-selection-button vibe-selection-action-row" :disabled="state.busy" @click="runAction(action.id)">{{ action.label }}</button>
          </template>
          <template v-else>
            <p v-if="!rows.length" class="vibe-selection-empty">{{ panel === 'review' ? 'No selected items.' : 'No destinations available.' }}</p>
            <div v-for="id in rows" :key="String(id)" class="vibe-selection-row">
              <template v-if="panel === 'review'">
                <span>{{ controller.getLabel(id) }}</span>
                <button type="button" class="vibe-selection-icon" :aria-label="`Remove ${controller.getLabel(id)} from selection`" :disabled="state.busy" @click="controller.toggle(id)"><X :size="18" aria-hidden="true" /></button>
              </template>
              <button v-else type="button" class="vibe-selection-button vibe-selection-destination" :aria-label="`Choose ${controller.getLabel(id)}`" :aria-pressed="String(destination) === String(id)" :disabled="state.busy" @click="destination = id">{{ controller.getLabel(id) }}</button>
            </div>
          </template>
        </div>
        <div v-if="pages > 1 && panel !== 'actions'" class="vibe-selection-pagination">
          <button type="button" class="vibe-selection-button" :disabled="page === 0" @click="page--">Previous</button>
          <span>Page {{ page + 1 }} of {{ pages }}</span>
          <button type="button" class="vibe-selection-button" :disabled="page + 1 >= pages" @click="page++">Next</button>
        </div>
        <div v-if="state.error" class="vibe-selection-operation" role="alert">{{ state.error }}<button type="button" class="vibe-selection-button" @click="retryOperation">Retry operation</button></div>
        <footer class="vibe-selection-panel-footer">
          <template v-if="panel === 'move'">
            <div class="vibe-selection-position" role="group" aria-label="Move position">
              <button type="button" class="vibe-selection-button" :aria-pressed="position === 'before'" :disabled="state.busy" @click="position = 'before'">Before</button>
              <button type="button" class="vibe-selection-button" :aria-pressed="position === 'after'" :disabled="state.busy" @click="position = 'after'">After</button>
            </div>
            <button type="button" class="vibe-selection-button vibe-selection-primary" :disabled="destination === null || state.busy" @click="move">Move items</button>
          </template>
          <template v-else-if="panel === 'review'">
            <button type="button" class="vibe-selection-button" :disabled="!state.count || state.busy" @click="controller.clear()">Clear selection</button>
            <button type="button" class="vibe-selection-button" @click="closePanel">Done</button>
          </template>
          <button v-if="state.busy" type="button" class="vibe-selection-button" @click="controller.cancel()">Cancel operation</button>
        </footer>
      </div>
    </dialog>
  </div>
</template>
