import type { MasonryItemBase } from '@/masonry/types'

export type MasonryFailurePayload = {
  item: MasonryItemBase
  error: unknown
}

export type MasonryPosition = {
  x: number
  y: number
}

export type LeavingClone = {
  id: string
  item: MasonryItemBase
  fromX: number
  fromY: number
  toY: number
  width: number
  height: number
  leaving: boolean
}
