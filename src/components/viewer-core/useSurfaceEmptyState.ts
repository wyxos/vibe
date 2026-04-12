import { computed, type Ref } from 'vue'

import { hasRenderableSlotContent } from './slotContent'
import type { VibeEmptyStateMode, VibeEmptyStateSlotProps } from './surfaceSlots'

export const DEFAULT_VIBE_EMPTY_STATE_MESSAGE = 'no items available'

export function useSurfaceEmptyState(options: {
  emptyStateMode: Ref<VibeEmptyStateMode | undefined>
  itemCount: Ref<number>
  loading: Ref<boolean | undefined>
  renderSlot?: ((props: VibeEmptyStateSlotProps) => unknown) | undefined
  surface: VibeEmptyStateSlotProps['surface']
}) {
  const emptyStateProps = computed<VibeEmptyStateSlotProps | null>(() => {
    if (options.loading.value || options.itemCount.value > 0 || options.emptyStateMode.value === 'hidden') {
      return null
    }

    return {
      loading: Boolean(options.loading.value),
      message: DEFAULT_VIBE_EMPTY_STATE_MESSAGE,
      mode: options.emptyStateMode.value === 'badge' ? 'badge' : 'inline',
      surface: options.surface,
      total: options.itemCount.value,
    }
  })

  const emptyStateNodes = computed(() => {
    if (!emptyStateProps.value || !options.renderSlot) {
      return []
    }

    return options.renderSlot(emptyStateProps.value)
  })

  return {
    emptyStateProps,
    showBadgeEmptyState: computed(() => emptyStateProps.value?.mode === 'badge'),
    showCustomEmptyState: computed(() => hasRenderableSlotContent(emptyStateNodes.value)),
    showInlineEmptyState: computed(() => emptyStateProps.value?.mode === 'inline'),
  }
}
