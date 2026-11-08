<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, shallowRef, watchEffect } from 'vue'
import { GripVertical, Move } from 'lucide-vue-next'
import type { VibeItemId } from '../types'
import { useSelectionContext } from './useSelectionContext'

const props = defineProps<{ postId: VibeItemId }>()
const context = useSelectionContext()
const controller = context?.controller
const root = shallowRef<HTMLElement | null>(null)
const article = shallowRef<HTMLElement | null>(null)
const selected = computed(() => {
  // The controller's membership map is intentionally private, so track its snapshot.
  void controller?.state.selectedIds
  return controller?.isSelected(props.postId) ?? false
})
const label = computed(() => controller?.getLabel(props.postId) ?? String(props.postId))
const selecting = computed(() => Boolean(controller?.enabled && controller.state.mode !== 'browse'))
const arranging = computed(() => controller?.state.mode === 'arrange')
const moveAllowed = computed(() => {
  void controller?.state.selectedIds
  return controller?.getMoveIds(props.postId) !== null
})
function startDrag(event: DragEvent): void {
  if (!context?.startDrag(props.postId, event)) event.preventDefault()
}

function dragOver(event: DragEvent): void {
  const source = context?.dragSource.value
  if (!context || source === null || source === undefined || !arranging.value) return
  const ids = controller?.getMoveIds(source)
  if (!ids || ids.some((id) => String(id) === String(props.postId))) return
  event.preventDefault()
  event.stopPropagation()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
  const rect = article.value?.getBoundingClientRect()
  context.dropTarget.value = props.postId
  context.dropPosition.value = rect && event.clientY > rect.top + rect.height / 2 ? 'after' : 'before'
}

function dragLeave(event: DragEvent): void {
  if (event.relatedTarget instanceof Node && article.value?.contains(event.relatedTarget)) return
  if (context && String(context.dropTarget.value) === String(props.postId)) context.dropTarget.value = null
}

function drop(event: DragEvent): void {
  if (!context || !controller || String(context.dropTarget.value) !== String(props.postId)) return
  const source = context.dragSource.value
  if (source === null) return
  event.preventDefault()
  event.stopPropagation()
  const position = context.dropPosition.value
  context.endDrag()
  void controller.reorder(source, props.postId, position)
}

onMounted(() => {
  article.value = root.value?.closest<HTMLElement>('.media-card') ?? null
  article.value?.addEventListener('dragover', dragOver)
  article.value?.addEventListener('dragleave', dragLeave)
  article.value?.addEventListener('drop', drop)
})

watchEffect(() => {
  const card = article.value
  if (!card || !context) return
  card.classList.toggle('media-card--selected', selected.value)
  card.dataset.selectionSelected = String(selected.value)
  const isTarget = context.dropTarget.value !== null && String(context.dropTarget.value) === String(props.postId)
  if (isTarget) card.dataset.reorderTarget = context.dropPosition.value
  else delete card.dataset.reorderTarget
})

onBeforeUnmount(() => {
  article.value?.removeEventListener('dragover', dragOver)
  article.value?.removeEventListener('dragleave', dragLeave)
  article.value?.removeEventListener('drop', drop)
  article.value?.classList.remove('media-card--selected')
})
</script>

<template>
  <div v-if="controller" ref="root" class="vibe-selection-card-controls" @click.stop @keydown.stop>
    <label v-if="selecting || selected" class="vibe-selection-check">
      <input
        type="checkbox" :checked="selected" :aria-label="`Select ${label}`"
        :disabled="controller.state.busy" @change="controller.toggle(postId)"
      >
    </label>
    <div v-if="arranging" class="vibe-selection-move-controls">
      <button
        type="button" class="vibe-selection-icon" :aria-label="`Move ${label}`" :title="`Move ${label}`"
        :disabled="controller.state.busy || !moveAllowed" @click="context && (context.moveSource.value = postId)"
      ><Move :size="18" aria-hidden="true" /></button>
      <button
        type="button" class="vibe-selection-icon vibe-selection-grip" draggable="true"
        :aria-label="`Drag to move ${label}`" :title="`Drag to move ${label}`"
        :disabled="controller.state.busy || !moveAllowed"
        @dragstart.stop="startDrag"
      ><GripVertical :size="18" aria-hidden="true" /></button>
    </div>
  </div>
</template>
