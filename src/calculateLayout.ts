import type {LayoutOptions, MasonryItem, ProcessedMasonryItem} from './types'

let __cachedScrollbarWidth: number | null = null

function getScrollbarWidth(): number {
    if (__cachedScrollbarWidth != null) return __cachedScrollbarWidth
    const div = document.createElement('div')
    div.style.visibility = 'hidden'
    div.style.overflow = 'scroll'
    ;(div.style as any).msOverflowStyle = 'scrollbar'
    div.style.width = '100px'
    div.style.height = '100px'
    document.body.appendChild(div)

    const inner = document.createElement('div')
    inner.style.width = '100%'
    div.appendChild(inner)

    const scrollbarWidth = div.offsetWidth - inner.offsetWidth
    document.body.removeChild(div)
    __cachedScrollbarWidth = scrollbarWidth
    return scrollbarWidth
}

export default function calculateLayout(
    items: MasonryItem[],
    container: HTMLElement,
    columnCount: number,
    options: LayoutOptions = {}
): ProcessedMasonryItem[] {
    const {
        gutterX = 0,
        gutterY = 0,
        header = 0,
        footer = 0,
        paddingLeft = 0,
        paddingRight = 0,
        sizes = {
            base: 1,
            sm: 2,
            md: 3,
            lg: 4,
            xl: 5,
            '2xl': 6
        },
        placement = 'masonry'
    } = options

    let cssPaddingLeft = 0
    let cssPaddingRight = 0
    try {
        if (container && container.nodeType === 1 && typeof window !== 'undefined' && window.getComputedStyle) {
            const styles = window.getComputedStyle(container)
            cssPaddingLeft = parseFloat(styles.paddingLeft) || 0
            cssPaddingRight = parseFloat(styles.paddingRight) || 0
        }
    } catch {
        // noop
    }

    const effectivePaddingLeft = (paddingLeft || 0) + cssPaddingLeft
    const effectivePaddingRight = (paddingRight || 0) + cssPaddingRight

    const measuredScrollbarWidth = container.offsetWidth - container.clientWidth
    const scrollbarWidth = measuredScrollbarWidth > 0 ? measuredScrollbarWidth + 2 : getScrollbarWidth() + 2

    const usableWidth = container.offsetWidth - scrollbarWidth - effectivePaddingLeft - effectivePaddingRight
    const totalGutterX = gutterX * (columnCount - 1)
    const columnWidth = Math.floor((usableWidth - totalGutterX) / columnCount)

    const baseHeights = items.map((item) => {
        const originalWidth = item.width
        const originalHeight = item.height
        const imageHeight = Math.round((columnWidth * originalHeight) / originalWidth)
        return imageHeight + footer + header
    })

    if (placement === 'sequential-balanced') {
        const n = baseHeights.length
        if (n === 0) return []

        const addWithGutter = (currentSum: number, itemsInGroup: number, nextHeight: number) => {
            return currentSum + (itemsInGroup > 0 ? gutterY : 0) + nextHeight
        }

        let low = Math.max(...baseHeights)
        let high = baseHeights.reduce((sum, h) => sum + h, 0) + gutterY * Math.max(0, n - 1)

        const canPartition = (cap: number) => {
            let groups = 1
            let sum = 0
            let count = 0
            for (let i = 0; i < n; i++) {
                const h = baseHeights[i]
                const next = addWithGutter(sum, count, h)
                if (next <= cap) {
                    sum = next
                    count++
                } else {
                    groups++
                    sum = h
                    count = 1
                    if (h > cap) return false
                    if (groups > columnCount) return false
                }
            }
            return groups <= columnCount
        }

        while (low < high) {
            const mid = Math.floor((low + high) / 2)
            if (canPartition(mid)) high = mid
            else low = mid + 1
        }
        const cap = high

        const starts = new Array<number>(columnCount).fill(0)
        let groupIndex = columnCount - 1
        let sum = 0
        let count = 0
        for (let i = n - 1; i >= 0; i--) {
            const h = baseHeights[i]
            const needAtLeast = i < groupIndex
            const canFit = addWithGutter(sum, count, h) <= cap
            if (!canFit || needAtLeast) {
                starts[groupIndex] = i + 1
                groupIndex--
                sum = h
                count = 1
            } else {
                sum = addWithGutter(sum, count, h)
                count++
            }
        }
        starts[0] = 0

        const processedItems: ProcessedMasonryItem[] = []
        const tops = new Array<number>(columnCount).fill(0)
        for (let col = 0; col < columnCount; col++) {
            const start = starts[col]
            const end = col + 1 < columnCount ? starts[col + 1] : n
            const left = col * (columnWidth + gutterX)
            for (let i = start; i < end; i++) {
                const item = items[i]
                const newItem: ProcessedMasonryItem = {
                    ...(item as any),
                    columnWidth,
                    imageHeight: 0,
                    columnHeight: 0,
                    left: 0,
                    top: 0
                }
                newItem.imageHeight = baseHeights[i] - (footer + header)
                newItem.columnHeight = baseHeights[i]
                newItem.left = left
                newItem.top = tops[col]
                tops[col] += newItem.columnHeight + (i + 1 < end ? gutterY : 0)
                processedItems.push(newItem)
            }
        }
        return processedItems
    }

    const columnHeights = new Array<number>(columnCount).fill(0)
    const processedItems: ProcessedMasonryItem[] = []

    for (let index = 0; index < items.length; index++) {
        const item = items[index]
        const newItem: ProcessedMasonryItem = {
            ...(item as any),
            columnWidth: 0,
            imageHeight: 0,
            columnHeight: 0,
            left: 0,
            top: 0
        }

        const col = columnHeights.indexOf(Math.min(...columnHeights))
        const originalWidth = item.width
        const originalHeight = item.height

        newItem.columnWidth = columnWidth
        newItem.left = col * (columnWidth + gutterX)
        newItem.imageHeight = Math.round((columnWidth * originalHeight) / originalWidth)
        newItem.columnHeight = newItem.imageHeight + footer + header
        newItem.top = columnHeights[col]

        columnHeights[col] += newItem.columnHeight + gutterY

        processedItems.push(newItem)
    }

    return processedItems
}
