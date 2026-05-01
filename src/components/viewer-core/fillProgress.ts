import { ref } from 'vue'
import type { VibeFillMode } from './removalState'

export function useFillProgressState(getLoadedItemCount: () => number) {
  const refs = {
    fillCompletedCalls: ref(0),
    fillLoadedCount: ref(0),
    fillMode: ref<VibeFillMode>('idle'),
    fillProgress: ref<number | null>(null),
    fillTargetCalls: ref<number | null>(null),
    fillTotalCount: ref<number | null>(null),
  }

  function reset() {
    refs.fillMode.value = 'idle'
    refs.fillCompletedCalls.value = 0
    refs.fillLoadedCount.value = getLoadedItemCount()
    refs.fillProgress.value = null
    refs.fillTargetCalls.value = null
    refs.fillTotalCount.value = null
  }

  return {
    refs,
    reset,
  }
}
