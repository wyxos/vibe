import { describe, it, expect } from 'vitest'
import calculateLayout from './calculateLayout'
import fixture from './pages.json'

describe('calculateLayout', () => {
    it('should calculate correct layout positions for known inputs', () => {
        const items = fixture[0].items.slice(0, 3) // first 3 items
        const mockContainer = {
            offsetWidth: 1000,
            clientWidth: 980 // scrollbarWidth = 20
        }
        const columnCount = 3
        const gutterX = 10
        const gutterY = 10

        const scrollbarWidth = mockContainer.offsetWidth - mockContainer.clientWidth
        const usableWidth = mockContainer.offsetWidth - scrollbarWidth
        const totalGutterX = gutterX * (columnCount - 1)
        const expectedColumnWidth = Math.floor((usableWidth - totalGutterX) / columnCount)

        const result = calculateLayout(items, mockContainer, columnCount, gutterX, gutterY)

        expect(result.length).toBe(3)

        result.forEach((item, i) => {
            const original = items[i]
            const expectedColumn = i % columnCount
            const expectedLeft = expectedColumn * (expectedColumnWidth + gutterX)
            const expectedHeight = Math.round((expectedColumnWidth * original.height) / original.width)

            expect(item.left).toBe(expectedLeft)
            expect(item.columnWidth).toBe(expectedColumnWidth)
            expect(item.columnHeight).toBe(expectedHeight)
        })

        // Test top stacking logic: second item in same column should be placed below with gutter
        const secondBatch = fixture[0].items.slice(0, 6)
        const stacked = calculateLayout(secondBatch, mockContainer, columnCount, gutterX, gutterY)
        for (let col = 0; col < columnCount; col++) {
            const colItems = stacked.filter((_, i) => i % columnCount === col)
            for (let j = 1; j < colItems.length; j++) {
                expect(colItems[j].top).toBe(
                    colItems[j - 1].top + colItems[j - 1].columnHeight + gutterY
                )
            }
        }
    })
})
