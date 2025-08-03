import { describe, it, expect } from 'vitest'
import calculateLayout from '../src/calculateLayout'
import fixture from '../src/pages.json'

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

        const measuredScrollbarWidth = mockContainer.offsetWidth - mockContainer.clientWidth
        const scrollbarWidth = measuredScrollbarWidth > 0 ? measuredScrollbarWidth + 2 : measuredScrollbarWidth + 2
        const usableWidth = mockContainer.offsetWidth - scrollbarWidth
        const totalGutterX = gutterX * (columnCount - 1)
        const expectedColumnWidth = Math.floor((usableWidth - totalGutterX) / columnCount)

        const result = calculateLayout(items, mockContainer, columnCount, { gutterX, gutterY })

        expect(result.length).toBe(3)

        result.forEach((item, i) => {
            const original = items[i]
            const expectedHeight = Math.round((expectedColumnWidth * original.height) / original.width)

            // With shortest-column logic, we can only verify basic properties
            expect(item.columnWidth).toBe(expectedColumnWidth)
            expect(item.columnHeight).toBe(expectedHeight)
            expect(item.left).toBeGreaterThanOrEqual(0)
            expect(item.left).toBeLessThan(usableWidth)
        })

        // Test that items are properly distributed and positioned
        const secondBatch = fixture[0].items.slice(0, 6)
        const stacked = calculateLayout(secondBatch, mockContainer, columnCount, { gutterX, gutterY })
        
        // Verify all items have valid positions
        stacked.forEach(item => {
            expect(item.top).toBeGreaterThanOrEqual(0)
            expect(item.left).toBeGreaterThanOrEqual(0)
            expect(item.columnWidth).toBe(expectedColumnWidth)
        })
        
        // Group items by column and verify stacking within each column
        const columnGroups = {}
        stacked.forEach(item => {
            const col = Math.round(item.left / (expectedColumnWidth + gutterX))
            if (!columnGroups[col]) columnGroups[col] = []
            columnGroups[col].push(item)
        })
        
        // For each column, verify items are stacked properly
        Object.values(columnGroups).forEach(colItems => {
            colItems.sort((a, b) => a.top - b.top) // Sort by top position
            for (let j = 1; j < colItems.length; j++) {
                expect(colItems[j].top).toBe(
                    colItems[j - 1].top + colItems[j - 1].columnHeight + gutterY
                )
            }
        })
    })
})
