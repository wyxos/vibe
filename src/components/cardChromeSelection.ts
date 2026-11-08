import type { VibeItemId, VibeLayout } from '../types'
import { useSelectionContext } from './useSelectionContext'

const interactive = 'a, button, input, textarea, select, label, summary, audio, video, [role="button"], [role="link"], [role="checkbox"], [role="switch"], [contenteditable]:not([contenteditable="false"]), [tabindex], [data-vibe-selection-ignore]'

/** Capture before consumer chrome stops bubbling, without taking over its controls. */
export function useCardChromeSelection(itemId: () => VibeItemId, layout: () => VibeLayout) {
  const selection = useSelectionContext()?.controller
  return (event: MouseEvent): void => {
    if (!selection?.enabled || selection.selectionOptions.activation !== 'card-chrome'
      || selection.state.busy || layout() !== 'masonry' || event.defaultPrevented
      || event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
    const target = event.target instanceof Element ? event.target : null
    if (!target) return
    const control = target.closest(interactive)
    if (control && event.currentTarget instanceof Element && event.currentTarget.contains(control)) return
    const textSelection = window.getSelection()
    if (textSelection && !textSelection.isCollapsed) return
    selection.toggle(itemId())
    event.stopPropagation()
  }
}
