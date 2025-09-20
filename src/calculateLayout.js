function getScrollbarWidth() {
    // Create a temporary div
    const div = document.createElement('div')
    div.style.visibility = 'hidden'
    div.style.overflow = 'scroll' // force scrollbar
    div.style.msOverflowStyle = 'scrollbar' // for IE
    div.style.width = '100px'
    div.style.height = '100px'

    // Append to body
    document.body.appendChild(div)

    // Create inner div and measure difference
    const inner = document.createElement('div')
    inner.style.width = '100%'
    div.appendChild(inner)

    const scrollbarWidth = div.offsetWidth - inner.offsetWidth

    // Clean up
    document.body.removeChild(div)

    return scrollbarWidth
}

export default function calculateLayout(items, container, columnCount, options = {}) {
    const {
        gutterX = 0,
        gutterY = 0,
        header = 0,
        footer = 0,
        paddingLeft = 0,
        paddingRight = 0,
        sizes = {
            base: 1,       // mobile-first default
            sm: 2,         // ≥ 640px
            md: 3,         // ≥ 768px
            lg: 4,         // ≥ 1024px
            xl: 5,         // ≥ 1280px
            '2xl': 6       // ≥ 1536px
        },
        // Placement strategy: 'masonry' (default) or 'sequential-balanced'
        placement = 'masonry'
    } = options;

    const measuredScrollbarWidth = container.offsetWidth - container.clientWidth;
    const scrollbarWidth = measuredScrollbarWidth > 0 ? measuredScrollbarWidth + 2 : getScrollbarWidth() + 2;
    const usableWidth = container.offsetWidth - scrollbarWidth - paddingLeft - paddingRight;
    const totalGutterX = gutterX * (columnCount - 1);
    const columnWidth = Math.floor((usableWidth - totalGutterX) / columnCount);

    // Precompute normalized item heights for the given column width
    const baseHeights = items.map((item) => {
        const originalWidth = item.width;
        const originalHeight = item.height;
        const imageHeight = Math.round((columnWidth * originalHeight) / originalWidth);
        // Column height for an item (without inter-item vertical gutter)
        return imageHeight + footer + header;
    });

    // If using the order-preserving strategy, partition the sequence into contiguous columns
    if (placement === 'sequential-balanced') {
        // Binary search the minimal max column height capacity that allows splitting into columnCount contiguous groups
        const n = baseHeights.length;
        if (n === 0) return [];

        const addWithGutter = (currentSum, itemsInGroup, nextHeight) => {
            return currentSum + (itemsInGroup > 0 ? gutterY : 0) + nextHeight;
        };

        let low = Math.max(...baseHeights); // at least the tallest item
        // All items in a single column upper bound (includes gutters between items)
        let high = baseHeights.reduce((sum, h) => sum + h, 0) + gutterY * Math.max(0, n - 1);

        const canPartition = (cap) => {
            let groups = 1;
            let sum = 0;
            let count = 0;
            for (let i = 0; i < n; i++) {
                const h = baseHeights[i];
                const next = addWithGutter(sum, count, h);
                if (next <= cap) {
                    sum = next;
                    count++;
                } else {
                    // start new group
                    groups++;
                    sum = h;
                    count = 1;
                    if (h > cap) return false; // single item exceeds cap
                    if (groups > columnCount) return false;
                }
            }
            return groups <= columnCount;
        };

        while (low < high) {
            const mid = Math.floor((low + high) / 2);
            if (canPartition(mid)) high = mid; else low = mid + 1;
        }
        const cap = high;

        // Build exact boundaries from the end to guarantee exactly columnCount groups
        const starts = new Array(columnCount).fill(0);
        let groupIndex = columnCount - 1;
        let sum = 0;
        let count = 0;
        for (let i = n - 1; i >= 0; i--) {
            const h = baseHeights[i];
            const needAtLeast = i < groupIndex; // force split so each remaining group gets >= 1 item
            const canFit = addWithGutter(sum, count, h) <= cap;
            if (!canFit || needAtLeast) {
                starts[groupIndex] = i + 1; // next group starts after i
                groupIndex--;
                sum = h;
                count = 1;
            } else {
                sum = addWithGutter(sum, count, h);
                count++;
            }
        }
        // First group starts at 0
        starts[0] = 0;

        // Now assign items to columns according to contiguous groups
        const processedItems = [];
        const tops = new Array(columnCount).fill(0);
        for (let col = 0; col < columnCount; col++) {
            const start = starts[col];
            const end = col + 1 < columnCount ? starts[col + 1] : n;
            const left = col * (columnWidth + gutterX);
            for (let i = start; i < end; i++) {
                const item = items[i];
                const newItem = { ...item };
                newItem.columnWidth = columnWidth;
                // recompute using precomputed baseHeights for determinism
                const imageHeight = baseHeights[i] - (footer + header);
                newItem.imageHeight = imageHeight;
                newItem.columnHeight = baseHeights[i];
                newItem.left = left;
                newItem.top = tops[col];
                tops[col] += newItem.columnHeight + (i + 1 < end ? gutterY : 0);
                processedItems.push(newItem);
            }
        }
        return processedItems;
    }

    // Default: Masonry (shortest-column) placement
    const columnHeights = new Array(columnCount).fill(0);
    const processedItems = [];

    for (let index = 0; index < items.length; index++) {
        const item = items[index];
        const newItem = { ...item };

        // Find the column with the shortest height for proper masonry layout
        const col = columnHeights.indexOf(Math.min(...columnHeights));
        const originalWidth = item.width;
        const originalHeight = item.height;

        newItem.columnWidth = columnWidth;
        newItem.left = col * (columnWidth + gutterX);
        newItem.imageHeight = Math.round((columnWidth * originalHeight) / originalWidth);
        newItem.columnHeight = newItem.imageHeight + footer + header;
        newItem.top = columnHeights[col];

        columnHeights[col] += newItem.columnHeight + gutterY;

        processedItems.push(newItem);
    }

    return processedItems;
}
