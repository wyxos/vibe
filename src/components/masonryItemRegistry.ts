import type { InjectionKey, Slot } from 'vue'
import type { MasonryItemBase } from '@/masonry/types'

export type MasonryItemSlotProps = {
  item: MasonryItemBase
  remove: () => void
}

export type MasonryItemLoaderSlotProps = MasonryItemSlotProps

export type MasonryItemErrorSlotProps = MasonryItemSlotProps & {
  error: unknown
  retry: () => void
}

export type MasonryItemDefinition = {
  header?: Slot<MasonryItemSlotProps>
  loader?: Slot<MasonryItemLoaderSlotProps>
  overlay?: Slot<MasonryItemSlotProps>
  error?: Slot<MasonryItemErrorSlotProps>
  footer?: Slot<MasonryItemSlotProps>
  onPreloaded?: (item: MasonryItemBase) => void
  onFailed?: (payload: { item: MasonryItemBase; error: unknown }) => void
}

export type RegisterMasonryItem = (definition: MasonryItemDefinition) => void

export const masonryItemRegistryKey: InjectionKey<RegisterMasonryItem> = Symbol('masonryItemRegistry')
