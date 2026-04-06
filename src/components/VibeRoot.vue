<script setup lang="ts">
import type { VibeRootProps } from './vibe-root/useVibeRoot'
import { useVibeRootController } from './vibe-root/useVibeRootController'

import VibeFullscreenSurface from './VibeFullscreenSurface.vue'
import VibeListSurface from './VibeListSurface.vue'

const props = defineProps<VibeRootProps>()

const emit = defineEmits<{
  'update:activeIndex': [value: number]
}>()

const root = useVibeRootController(props, emit)
</script>

<template>
  <section
    data-testid="vibe-root"
    :data-surface-mode="root.surfaceMode.value"
    class="relative h-full min-h-0 overflow-hidden bg-[#05060a] text-[#f7f1ea]"
  >
    <button
      v-if="root.canRetryInitialLoad.value"
      type="button"
      class="absolute left-5 top-5 z-30 inline-flex items-center border border-rose-400/55 bg-rose-500/18 px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-white backdrop-blur transition hover:bg-rose-500/28"
      @click="root.retryInitialLoad"
    >
      Retry
    </button>

    <div
      v-else-if="root.errorMessage.value && root.items.value.length > 0"
      class="absolute left-5 top-5 z-30 border border-amber-400/45 bg-black/35 px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-amber-100 backdrop-blur"
    >
      {{ root.errorMessage.value }}
    </div>

    <div
      v-if="root.items.value.length === 0"
      class="relative z-[1] grid h-full w-full justify-items-center gap-6 px-[clamp(2rem,4vw,3rem)] py-[clamp(2rem,4vw,3rem)] text-center"
    >
      <p class="m-0 text-[0.78rem] font-bold uppercase tracking-[0.28em] text-[#f7f1ea]/68">
        {{ root.loading.value ? 'Syncing' : 'Viewer ready' }}
      </p>
      <h2 class="m-0 text-[clamp(2rem,4.4vw,3.6rem)] leading-[0.95] tracking-[-0.05em]">
        {{ root.loading.value ? 'Loading the viewer' : 'No items available' }}
      </h2>
      <p class="m-0 text-[clamp(0.98rem,1.3vw,1.12rem)] leading-[1.8] text-[#f7f1ea]/70">
        {{
          root.loading.value
            ? 'Pulling the first page from the fake server.'
            : 'Attach items to VibeRoot to turn this screen into the workspace.'
        }}
      </p>
    </div>

    <VibeListSurface
      v-else-if="root.surfaceMode.value === 'list'"
      :items="root.items.value"
      :active-index="root.activeIndex.value"
      :loading="root.loading.value"
      :has-next-page="root.hasNextPage.value"
      :pagination-detail="root.paginationDetail.value"
      :request-next-page="root.prefetchNextPage"
      :restore-token="root.listRestoreToken.value"
      @open-fullscreen="root.openFullscreen"
      @update:active-index="root.setActiveIndex"
    />

    <VibeFullscreenSurface
      v-else
      :items="root.items.value"
      :active-index="root.activeIndex.value"
      :loading="root.loading.value"
      :has-next-page="root.hasNextPage.value"
      :pagination-detail="root.paginationDetail.value"
      :show-back-to-list="root.showBackToList.value"
      @back-to-list="root.returnToList"
      @update:active-index="root.setActiveIndex"
    />
  </section>
</template>
