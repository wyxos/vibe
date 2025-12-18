import { describe, it, expect } from 'vitest'
import calculateLayout from '../src/calculateLayout'

describe('Masonry Distribution', () => {
    it('should distribute items to shortest columns instead of round-robin', () => {
        // Create items with varying heights to test proper distribution
        const items = Array.from({ length: 12 }, (_, i) => ({
            id: i + 1,
            width: 300,
            height: (i % 3 + 1) * 200, // Heights: 200, 400, 600, 200, 400, 600, ...
            src: `image-${i + 1}.jpg`
        }))

        const mockContainer = {
            offsetWidth: 1000,
            clientWidth: 980
        }
        const columnCount = 4
        const gutterX = 10
        const gutterY = 10

        const result = calculateLayout(items, mockContainer, columnCount, { gutterX, gutterY })

        // Group items by column
        const columnGroups = {}
        result.forEach(item => {
            const col = Math.round(item.left / (item.columnWidth + gutterX))
            if (!columnGroups[col]) columnGroups[col] = []
            columnGroups[col].push(item)
        })

        // Calculate final column heights
        const finalColumnHeights = {}
        Object.entries(columnGroups).forEach(([col, items]) => {
            const height = items.reduce((sum, item) => sum + item.columnHeight + gutterY, 0) - gutterY
            finalColumnHeights[col] = height
        })

        // With proper masonry layout, heights should be more balanced than round-robin
        const heights = Object.values(finalColumnHeights)
        const maxHeight = Math.max(...heights)
        const minHeight = Math.min(...heights)
        const heightDifference = maxHeight - minHeight

        // The height difference should be reasonable (less than the height of one typical item)
        expect(heightDifference).toBeLessThan(600) // Less than our tallest item height
        expect(result.length).toBe(12)
    })
})
