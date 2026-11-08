import { getCurrentScope, inject, onScopeDispose, shallowRef, type InjectionKey, type ShallowRef } from 'vue'
import type { VibeSelectionController } from '../core/selection'
import type { VibeItemId } from '../types'
import type { VibeReorderPosition } from '../selection'

export interface VibeSelectionContext {
  controller: VibeSelectionController
  visibleIds: ShallowRef<readonly VibeItemId[]>
  dragSource: ShallowRef<VibeItemId | null>
  dropTarget: ShallowRef<VibeItemId | null>
  dropPosition: ShallowRef<VibeReorderPosition>
  moveSource: ShallowRef<VibeItemId | null>
  startDrag: (source: VibeItemId, event: DragEvent) => boolean
  endDrag: () => void
}

export const selectionContextKey: InjectionKey<VibeSelectionContext> = Symbol('vibe-selection')

export function createSelectionContext(controller: VibeSelectionController): VibeSelectionContext {
  let dragPreview: HTMLElement | null = null
  let dragDocument: Document | null = null
  const onEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') context.endDrag() }
  const context: VibeSelectionContext = {
    controller,
    visibleIds: shallowRef<readonly VibeItemId[]>([]),
    dragSource: shallowRef<VibeItemId | null>(null),
    dropTarget: shallowRef<VibeItemId | null>(null),
    dropPosition: shallowRef<VibeReorderPosition>('before'),
    moveSource: shallowRef<VibeItemId | null>(null),
    startDrag(source, event) {
      const ids = controller.getMoveIds(source)
      if (!ids || controller.state.busy || !event.dataTransfer) return false
      context.endDrag()
      context.dragSource.value = source
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('application/x-vibe-item', String(source))
      dragDocument = (event.target as HTMLElement | null)?.ownerDocument ?? document
      dragPreview = dragDocument.createElement('div')
      dragPreview.className = 'vibe-selection-drag-preview'
      const caption = dragDocument.createElement('span')
      caption.textContent = `Move ${ids.length} ${ids.length === 1 ? 'item' : 'items'}`
      dragPreview.append(caption)
      dragDocument.body.append(dragPreview)
      event.dataTransfer.setDragImage(dragPreview, 16, 16)
      // A virtualized source card can unmount while dragging. The feed owns the
      // session until the document reports completion, cancellation or teardown.
      dragDocument.addEventListener('dragend', context.endDrag, true)
      dragDocument.addEventListener('drop', context.endDrag)
      dragDocument.addEventListener('keydown', onEscape, true)
      dragDocument.defaultView?.addEventListener('blur', context.endDrag)
      return true
    },
    endDrag() {
      dragPreview?.remove()
      dragPreview = null
      dragDocument?.removeEventListener('dragend', context.endDrag, true)
      dragDocument?.removeEventListener('drop', context.endDrag)
      dragDocument?.removeEventListener('keydown', onEscape, true)
      dragDocument?.defaultView?.removeEventListener('blur', context.endDrag)
      dragDocument = null
      context.dragSource.value = null
      context.dropTarget.value = null
    },
  }
  if (getCurrentScope()) onScopeDispose(context.endDrag)
  return context
}

export function useSelectionContext(): VibeSelectionContext | null {
  return inject(selectionContextKey, null)
}
