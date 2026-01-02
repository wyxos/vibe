import type { InjectionKey, Slot } from 'vue'
import type { MasonryItemBase } from '@/masonry/types'

export type MasonryItemSlotProps = {
  item: MasonryItemBase
  remove: () => void
}

export type MasonryItemDefinition = {
  header?: Slot<MasonryItemSlotProps>
  overlay?: Slot<MasonryItemSlotProps>
  footer?: Slot<MasonryItemSlotProps>
  onPreloaded?: (item: MasonryItemBase) => void
  onFailed?: (payload: { item: MasonryItemBase; error: unknown }) => void
}

export type RegisterMasonryItem = (definition: MasonryItemDefinition) => void

export const masonryItemRegistryKey: InjectionKey<RegisterMasonryItem> = Symbol('masonryItemRegistry')
