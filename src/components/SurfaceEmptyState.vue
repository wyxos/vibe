<script setup lang="ts">
import { useAttrs } from 'vue'

import type { VibeEmptyStateSlotProps } from './viewer-core/surfaceSlots'

defineOptions({
  inheritAttrs: false,
})

defineProps<{
  message: string
  mode: VibeEmptyStateSlotProps['mode']
  surface: VibeEmptyStateSlotProps['surface']
}>()

const attrs = useAttrs()
</script>

<template>
  <div
    v-if="mode === 'inline'"
    v-bind="attrs"
    data-testid="vibe-empty-state-inline"
    :data-surface="surface"
    class="pointer-events-none absolute z-[4] text-center"
    :class="surface === 'grid'
      ? 'inset-x-0 top-[clamp(6rem,22vh,11rem)] flex justify-center px-6'
      : 'inset-0 grid place-items-center px-[clamp(2rem,4vw,3rem)] py-[clamp(2rem,4vw,3rem)]'"
  >
    <slot>
      <p
        class="m-0 text-[0.82rem] font-medium tracking-[0.08em]"
        :class="surface === 'grid' ? 'text-[#f7f1ea]/58' : 'text-[#f7f1ea]/64'"
      >
        {{ message }}
      </p>
    </slot>
  </div>

  <div
    v-else
    v-bind="attrs"
    class="pointer-events-none absolute z-[4]"
    :class="surface === 'grid'
      ? 'inset-x-0 bottom-0 flex justify-center px-6'
      : 'bottom-[1.8rem] left-1/2 -translate-x-1/2 max-[720px]:bottom-[1.3rem]'"
  >
    <slot>
      <span
        data-testid="vibe-empty-state-badge"
        :data-surface="surface"
        class="inline-flex items-center border border-white/14 backdrop-blur-[18px]"
        :class="surface === 'grid'
          ? 'bg-black/55 px-4 py-3 text-[0.82rem] font-medium tracking-[0.08em] text-[#f7f1ea]/72'
          : 'w-auto bg-black/40 px-5 py-3 text-[0.82rem] font-medium tracking-[0.08em] text-[#f7f1ea]/74 max-[720px]:w-[calc(100%-2.5rem)] max-[720px]:justify-center'"
      >
        {{ message }}
      </span>
    </slot>
  </div>
</template>
