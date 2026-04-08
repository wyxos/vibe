<script setup lang="ts">
import { onBeforeUnmount, type Component } from 'vue'

import type { VibeViewerItem } from './viewer'
import { createAssetErrorBatchReporter, type VibeAssetErrorEvent } from './viewer-core/assetErrors'
import type { VibeHandle, VibeProps } from './viewer-core/useViewer'
import { useController } from './viewer-core/useController'

import FullscreenSurface from './FullscreenSurface.vue'
import ListSurface from './ListSurface.vue'

defineOptions({
  name: 'VibeLayout',
})

const props = defineProps<VibeProps>()
const slots = defineSlots<{
  'grid-footer'?: () => unknown
  'grid-item-overlay'?: (props: {
    active: boolean
    focused: boolean
    hovered: boolean
    index: number
    item: VibeViewerItem
    openFullscreen: () => void
  }) => unknown
  'item-icon'?: (props: { icon: Component; item: VibeViewerItem }) => unknown
}>()

const emit = defineEmits<{
  'asset-errors': [errors: VibeAssetErrorEvent[]]
  'update:activeIndex': [value: number]
}>()

const viewer = useController(props, emit)
const assetErrorBatch = createAssetErrorBatchReporter((errors) => {
  emit('asset-errors', errors)
})

onBeforeUnmount(() => {
  assetErrorBatch.stop()
})

defineExpose<VibeHandle>({
  clearRemoved: viewer.clearRemoved,
  getRemovedIds: viewer.getRemovedIds,
  remove: viewer.remove,
  restore: viewer.restore,
  status: viewer.status,
  undo: viewer.undo,
})
</script>

<template>
  <section
    data-testid="vibe"
    :data-surface-mode="viewer.surfaceMode.value"
    class="relative h-full min-h-0 overflow-hidden bg-[#05060a] text-[#f7f1ea]"
  >
    <button
      v-if="viewer.canRetryInitialLoad.value"
      type="button"
      class="absolute left-5 top-5 z-30 inline-flex items-center border border-rose-400/55 bg-rose-500/18 px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-white backdrop-blur transition hover:bg-rose-500/28"
      @click="viewer.retryInitialLoad"
    >
      Retry
    </button>

    <div
      v-else-if="viewer.errorMessage.value && viewer.items.value.length > 0"
      class="absolute left-5 top-5 z-30 border border-amber-400/45 bg-black/35 px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-amber-100 backdrop-blur"
    >
      {{ viewer.errorMessage.value }}
    </div>

    <div
      v-if="viewer.items.value.length === 0"
      class="relative z-[1] grid h-full w-full justify-items-center gap-6 px-[clamp(2rem,4vw,3rem)] py-[clamp(2rem,4vw,3rem)] text-center"
    >
      <p class="m-0 text-[0.78rem] font-bold uppercase tracking-[0.28em] text-[#f7f1ea]/68">
        {{ viewer.loading.value ? 'Syncing' : 'Viewer ready' }}
      </p>
      <h2 class="m-0 text-[clamp(2rem,4.4vw,3.6rem)] leading-[0.95] tracking-[-0.05em]">
        {{ viewer.loading.value ? 'Loading the viewer' : 'No items available' }}
      </h2>
        <p class="m-0 text-[clamp(0.98rem,1.3vw,1.12rem)] leading-[1.8] text-[#f7f1ea]/70">
          {{
            viewer.loading.value
              ? 'Pulling the first page from the fake server.'
              : 'Attach items to VibeLayout to turn this screen into the viewer.'
          }}
        </p>
    </div>

    <template v-else-if="viewer.isDesktop.value">
      <Transition
        appear
        enter-active-class="transition-[opacity,transform] duration-300 ease-out"
        enter-from-class="translate-y-3 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition-[opacity,transform] duration-300 ease-out"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="translate-y-3 opacity-0"
      >
        <div
          v-show="viewer.surfaceMode.value === 'list'"
          data-testid="vibe-list-surface"
          :data-visible="viewer.surfaceMode.value === 'list' ? 'true' : 'false'"
          :inert="viewer.surfaceMode.value !== 'list'"
          class="absolute inset-0 z-[2]"
        >
          <ListSurface
            :active="viewer.surfaceMode.value === 'list'"
            :items="viewer.items.value"
            :active-index="viewer.activeIndex.value"
            :loading="viewer.loading.value"
            :has-next-page="viewer.hasNextPage.value"
            :has-previous-page="viewer.hasPreviousPage.value"
            :pending-append-items="viewer.pendingAppendItems.value"
            :commit-pending-append="viewer.commitPendingAppend"
            :pagination-detail="viewer.paginationDetail.value"
            :report-asset-error="assetErrorBatch.report"
            :request-next-page="viewer.prefetchNextPage"
            :request-previous-page="viewer.prefetchPreviousPage"
            :restore-token="viewer.listRestoreToken.value"
            @open-fullscreen="viewer.openFullscreen"
            @update:active-index="viewer.setActiveIndex"
          >
            <template v-if="slots['grid-footer']" #grid-footer>
              <slot name="grid-footer" />
            </template>
            <template v-if="slots['grid-item-overlay']" #grid-item-overlay="slotProps">
              <slot name="grid-item-overlay" v-bind="slotProps" />
            </template>
            <template v-if="slots['item-icon']" #item-icon="slotProps">
              <slot name="item-icon" v-bind="slotProps" />
            </template>
          </ListSurface>
        </div>
      </Transition>

      <Transition
        appear
        enter-active-class="transition-[opacity,transform] duration-300 ease-out"
        enter-from-class="-translate-y-3 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition-[opacity,transform] duration-300 ease-out"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="-translate-y-3 opacity-0"
      >
        <div
          v-show="viewer.surfaceMode.value === 'fullscreen'"
          data-testid="vibe-fullscreen-surface"
          :data-visible="viewer.surfaceMode.value === 'fullscreen' ? 'true' : 'false'"
          :inert="viewer.surfaceMode.value !== 'fullscreen'"
          class="absolute inset-0 z-[3]"
        >
          <FullscreenSurface
            :items="viewer.items.value"
            :active="viewer.surfaceMode.value === 'fullscreen'"
            :active-index="viewer.activeIndex.value"
            :loading="viewer.loading.value"
            :has-next-page="viewer.hasNextPage.value"
            :pagination-detail="viewer.paginationDetail.value"
            :report-asset-error="assetErrorBatch.report"
            :show-back-to-list="viewer.showBackToList.value"
            @back-to-list="viewer.returnToList"
            @update:active-index="viewer.setActiveIndex"
          >
            <template v-if="slots['item-icon']" #item-icon="slotProps">
              <slot name="item-icon" v-bind="slotProps" />
            </template>
          </FullscreenSurface>
        </div>
      </Transition>
    </template>

    <FullscreenSurface
      v-else
      :items="viewer.items.value"
      :active="true"
      :active-index="viewer.activeIndex.value"
      :loading="viewer.loading.value"
      :has-next-page="viewer.hasNextPage.value"
      :pagination-detail="viewer.paginationDetail.value"
      :report-asset-error="assetErrorBatch.report"
      :show-back-to-list="false"
      @back-to-list="viewer.returnToList"
      @update:active-index="viewer.setActiveIndex"
    >
      <template v-if="slots['item-icon']" #item-icon="slotProps">
        <slot name="item-icon" v-bind="slotProps" />
      </template>
    </FullscreenSurface>
  </section>
</template>
