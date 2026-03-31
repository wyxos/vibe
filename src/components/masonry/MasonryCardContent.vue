<script setup lang="ts">
import { defineComponent } from 'vue'
import type { CSSProperties, Slot } from 'vue'
import MasonryLoader from '@/components/MasonryLoader.vue'
import type { MasonryItemBase } from '@/masonry/types'
import type {
  MasonryItemErrorSlotProps,
  MasonryItemLoaderSlotProps,
  MasonryItemSlotProps,
} from '@/components/masonryItemRegistry'
import type { MasonryFailurePayload } from '@/components/masonry/types'

type Props = {
  item: MasonryItemBase
  remove?: () => void
  hovered?: boolean
  hoverEventsEnabled?: boolean
  hasHeaderSlot?: boolean
  hasFooterSlot?: boolean
  hasOverlaySlot?: boolean
  headerStyle?: CSSProperties
  footerStyle?: CSSProperties
  itemHeaderSlotFn?: Slot<MasonryItemSlotProps>
  itemLoaderSlotFn?: Slot<MasonryItemLoaderSlotProps>
  itemOverlaySlotFn?: Slot<MasonryItemSlotProps>
  itemErrorSlotFn?: Slot<MasonryItemErrorSlotProps>
  itemFooterSlotFn?: Slot<MasonryItemSlotProps>
}

const props = withDefaults(defineProps<Props>(), {
  hovered: false,
  hoverEventsEnabled: true,
  hasHeaderSlot: false,
  hasFooterSlot: false,
  hasOverlaySlot: false,
})

const emit = defineEmits<{
  (e: 'success', item: MasonryItemBase): void
  (e: 'error', payload: MasonryFailurePayload): void
  (e: 'hover-start', id: string): void
  (e: 'hover-end', id: string): void
}>()

const SlotRenderer = defineComponent({
  name: 'SlotRenderer',
  props: {
    slotFn: {
      type: Function,
      required: false,
    },
    slotProps: {
      type: Object,
      required: true,
    },
  },
  setup(slotProps) {
    return () => {
      const fn = slotProps.slotFn as ((value: unknown) => unknown) | undefined
      return fn ? (fn(slotProps.slotProps) as unknown) : null
    }
  },
})

function remove() {
  props.remove?.()
}

function handleSuccess(item: MasonryItemBase) {
  emit('success', item)
}

function handleError(payload: MasonryFailurePayload) {
  emit('error', payload)
}

function handleMouseEnter() {
  if (!props.hoverEventsEnabled) return
  emit('hover-start', props.item.id)
}

function handleMouseLeave() {
  if (!props.hoverEventsEnabled) return
  emit('hover-end', props.item.id)
}
</script>

<template>
  <div
    v-if="props.hasHeaderSlot || props.headerStyle"
    data-testid="item-header-container"
    class="vibe-masonry__section"
    :style="props.headerStyle"
  >
    <SlotRenderer
      :slot-fn="props.itemHeaderSlotFn"
      :slot-props="{ item: props.item, remove }"
    />
  </div>

  <div
    class="vibe-masonry__media"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <MasonryLoader
      :item="props.item"
      :remove="remove"
      :loader-slot-fn="props.itemLoaderSlotFn"
      :error-slot-fn="props.itemErrorSlotFn"
      :hovered="props.hovered"
      @success="handleSuccess"
      @error="handleError"
    />

    <div v-if="props.hasOverlaySlot" class="vibe-masonry__overlay">
      <SlotRenderer
        :slot-fn="props.itemOverlaySlotFn"
        :slot-props="{ item: props.item, remove }"
      />
    </div>
  </div>

  <div
    v-if="props.hasFooterSlot || props.footerStyle"
    data-testid="item-footer-container"
    class="vibe-masonry__section"
    :style="props.footerStyle"
  >
    <SlotRenderer
      :slot-fn="props.itemFooterSlotFn"
      :slot-props="{ item: props.item, remove }"
    />
  </div>
</template>
