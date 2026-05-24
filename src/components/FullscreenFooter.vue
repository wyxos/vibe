<script setup lang="ts">
import { computed } from 'vue'
import type { VibeSurfaceStatusKind } from './viewer-core/surfaceSlots'

const props = defineProps<{
  showEndBadge?: boolean
  showStatus?: boolean
  statusKind?: VibeSurfaceStatusKind | null
  statusMessage?: string | null
}>()

const statusClass = computed(() => {
  if (props.statusKind === 'end') {
    return 'border-amber-300/35 text-amber-200'
  }

  if (props.statusKind === 'failed') {
    return 'border-rose-400/45 text-rose-100'
  }

  return ''
})
</script>

<template>
  <footer
    data-testid="vibe-fullscreen-footer"
    class="relative z-[3] shrink-0 border-t border-white/10 bg-[#05060a] px-3 py-2"
  >
    <div class="grid gap-2">
      <slot />

      <div v-if="props.showStatus || props.showEndBadge" class="flex flex-wrap items-center justify-center gap-2">
        <slot v-if="props.showStatus && $slots.status" name="status" />
        <div
          v-else-if="props.showStatus"
          data-testid="vibe-fullscreen-status-badge"
          class="inline-flex w-auto items-center border border-white/12 bg-black/20 px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[#f7f1ea]/74 max-[720px]:w-full max-[720px]:justify-center"
          :class="statusClass"
        >
          {{ props.statusMessage }}
        </div>
        <span
          v-if="props.showEndBadge"
          class="inline-flex items-center border border-amber-300/35 bg-black/20 px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-amber-200"
        >
          End reached
        </span>
      </div>
    </div>
  </footer>
</template>
