export type MasonryItem = {
  id: string
  width: number
  height: number
  page: number
  index: number
  src: string
  // allow extra fields
  [key: string]: any
}

export type ProcessedMasonryItem = MasonryItem & {
  columnWidth: number
  imageHeight: number
  columnHeight: number
  left: number
  top: number
}

export type LayoutOptions = {
  gutterX?: number
  gutterY?: number
  header?: number
  footer?: number
  paddingLeft?: number
  paddingRight?: number
  sizes?: {
    base: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
    '2xl'?: number
  }
  placement?: 'masonry' | 'sequential-balanced'
}

export type GetPageResult = { items: MasonryItem[]; nextPage: number | null }
