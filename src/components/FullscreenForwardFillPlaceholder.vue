<script setup lang="ts">
import { computed } from 'vue'
import { LoaderCircle } from 'lucide-vue-next'
import type { VibeFillMode, VibeLoadPhase } from './viewer-core/useViewer'

const props = withDefaults(defineProps<{
  fillCollectedCount?: number | null
  fillCompletedCalls?: number | null
  fillLoadedCount?: number | null
  fillMode?: VibeFillMode | null
  fillProgress?: number | null
  fillTargetCalls?: number | null
  fillTargetCount?: number | null
  fillTotalCount?: number | null
  hasNextPage?: boolean
  phase?: VibeLoadPhase | null
  statusMessage?: string | null
}>(), {
  fillCollectedCount: null,
  fillCompletedCalls: 0,
  fillLoadedCount: 0,
  fillMode: 'idle',
  fillProgress: null,
  fillTargetCalls: null,
  fillTargetCount: null,
  fillTotalCount: null,
  hasNextPage: false,
  phase: null,
  statusMessage: null,
})

const message = computed(() => {
  if (props.phase === 'filling') return props.statusMessage ?? 'Filling the view'
  return props.hasNextPage ? 'Loading more items' : (props.statusMessage ?? 'Loading more items')
})
const fillIsActive = computed(() => props.phase === 'filling' || (props.fillMode ?? 'idle') !== 'idle')
const progressValue = computed(() => {
  if (!fillIsActive.value) return null
  const explicitProgress = normalizeRatio(props.fillProgress)
  if (explicitProgress !== null) return explicitProgress

  const collectedCount = normalizeCount(props.fillCollectedCount)
  const targetCount = normalizeCount(props.fillTargetCount)
  if (collectedCount !== null && targetCount !== null && targetCount > 0) {
    return clampRatio(collectedCount / targetCount)
  }

  const loadedCount = normalizeCount(props.fillLoadedCount)
  const totalCount = normalizeCount(props.fillTotalCount)
  if (loadedCount !== null && totalCount !== null && totalCount > 0) {
    return clampRatio(loadedCount / totalCount)
  }

  return null
})
const progressLabel = computed(() => {
  if (!fillIsActive.value) return null
  const collectedCount = normalizeCount(props.fillCollectedCount)
  const targetCount = normalizeCount(props.fillTargetCount)
  if (collectedCount !== null && targetCount !== null && targetCount > 0) {
    return `${collectedCount} / ${targetCount} items`
  }

  const completedCalls = normalizeCount(props.fillCompletedCalls) ?? 0
  const targetCalls = normalizeCount(props.fillTargetCalls)
  if (targetCalls !== null && targetCalls > 0) {
    return `${completedCalls} / ${targetCalls} calls`
  }

  const loadedCount = normalizeCount(props.fillLoadedCount) ?? 0
  const totalCount = normalizeCount(props.fillTotalCount)
  if (totalCount !== null) {
    return `${loadedCount} / ${totalCount} loaded`
  }

  return completedCalls > 0 ? `${loadedCount} loaded / ${completedCalls} calls` : null
})
const progressPercentLabel = computed(() => progressValue.value === null ? null : `${Math.round(progressValue.value * 100)}%`)
const progressBarStyle = computed(() => ({
  width: `${(progressValue.value ?? 0) * 100}%`,
}))

function normalizeCount(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : null
}

function normalizeRatio(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? clampRatio(value) : null
}

function clampRatio(value: number) {
  return Math.min(Math.max(value, 0), 1)
}
</script>

<template>
  <div data-testid="vibe-forward-fill-placeholder" class="grid h-full min-h-0 place-items-center px-6 text-center">
    <div class="grid w-full max-w-[22rem] justify-items-center gap-4 border border-white/14 bg-black/40 px-8 py-7 backdrop-blur-[18px]">
      <span class="inline-flex h-12 w-12 items-center justify-center rounded-full bg-black/45 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.85)]"><LoaderCircle class="h-5 w-5 animate-spin stroke-[1.9] text-[#f7f1ea]/78" aria-hidden="true" /></span>
      <p data-testid="vibe-forward-fill-message" class="m-0 text-[0.78rem] font-bold uppercase tracking-[0.24em] text-[#f7f1ea]/72">{{ message }}</p>
      <div v-if="progressLabel" data-testid="vibe-forward-fill-progress" class="grid w-full gap-2">
        <div class="flex items-center justify-between gap-4 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-[#f7f1ea]/58">
          <span>{{ progressLabel }}</span>
          <span v-if="progressPercentLabel">{{ progressPercentLabel }}</span>
        </div>
        <div v-if="progressValue !== null" class="h-1 w-full overflow-hidden bg-white/10">
          <span data-testid="vibe-forward-fill-progress-bar" class="block h-full bg-[#f7f1ea]/58 transition-[width] duration-200" :style="progressBarStyle" />
        </div>
      </div>
    </div>
  </div>
</template>
