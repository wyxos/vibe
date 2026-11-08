import type { VibeSelectionApi } from '../selection'
import type { VibeSelectionController } from './selection'

export function attachSelectionApi<T extends { selection: VibeSelectionController }>(instance: T): T & VibeSelectionApi {
  return Object.assign(instance, selectionApi(instance.selection))
}

/** Keep consumer methods bound while leaving the existing instance API intact. */
export function selectionApi(controller: VibeSelectionController): VibeSelectionApi {
  return {
    getSelection: () => controller.getSelection(),
    setSelection: (ids) => controller.set(ids),
    toggleSelection: (id) => controller.toggle(id),
    clearSelection: () => controller.clear(),
    setSelectionMode: (mode) => controller.setMode(mode),
    reorderItems: (source, target, position) => controller.reorder(source, target, position),
    runSelectionAction: (id) => controller.runAction(id),
    retrySelectionOperation: () => controller.retry(),
    cancelSelectionOperation: () => controller.cancel(),
  }
}
