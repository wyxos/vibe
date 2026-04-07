import { ref } from 'vue'

export interface VibeRootRemoveResult {
  ids: string[]
}

export interface VibeRootHandle {
  clearRemoved: () => void
  getRemovedIds: () => string[]
  remove: (ids: string | string[]) => VibeRootRemoveResult
  restore: (ids: string | string[]) => VibeRootRemoveResult
  undo: () => VibeRootRemoveResult | null
}

export function useVibeRemovalState() {
  const removedIds = ref<Set<string>>(new Set())
  const removalHistory = ref<string[][]>([])

  function remove(ids: string | string[]) {
    const nextIds = normalizeIds(ids).filter((id) => !removedIds.value.has(id))

    if (!nextIds.length) {
      return { ids: [] }
    }

    const nextRemovedIds = new Set(removedIds.value)
    for (const id of nextIds) {
      nextRemovedIds.add(id)
    }

    removedIds.value = nextRemovedIds
    removalHistory.value = [...removalHistory.value, nextIds]
    return { ids: nextIds }
  }

  function restore(ids: string | string[]) {
    const nextIds = normalizeIds(ids).filter((id) => removedIds.value.has(id))

    if (!nextIds.length) {
      return { ids: [] }
    }

    const nextRemovedIds = new Set(removedIds.value)
    for (const id of nextIds) {
      nextRemovedIds.delete(id)
    }

    removedIds.value = nextRemovedIds
    return { ids: nextIds }
  }

  function undo() {
    if (!removalHistory.value.length) {
      return null
    }

    const nextHistory = [...removalHistory.value]
    const lastIds = nextHistory.pop() ?? []
    removalHistory.value = nextHistory

    const restoredIds = lastIds.filter((id) => removedIds.value.has(id))
    if (!restoredIds.length) {
      return { ids: [] }
    }

    const nextRemovedIds = new Set(removedIds.value)
    for (const id of restoredIds) {
      nextRemovedIds.delete(id)
    }

    removedIds.value = nextRemovedIds
    return { ids: restoredIds }
  }

  function clearRemoved() {
    if (!removedIds.value.size && !removalHistory.value.length) {
      return
    }

    removedIds.value = new Set()
    removalHistory.value = []
  }

  function getRemovedIds() {
    return Array.from(removedIds.value)
  }

  return {
    clearRemoved,
    getRemovedIds,
    remove,
    removedIds,
    restore,
    undo,
  }
}

function normalizeIds(ids: string | string[]) {
  const nextIds = Array.isArray(ids) ? ids : [ids]
  return Array.from(new Set(nextIds.filter((value) => typeof value === 'string' && value.length > 0)))
}
