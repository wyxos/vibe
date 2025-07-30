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
            base: 1,
            sm: 2,
            md: 3,
            lg: 4,
            xl: 5,
            '2xl': 6
        }
    } = options;

    const measuredScrollbarWidth = container.offsetWidth - container.clientWidth;
    const scrollbarWidth = measuredScrollbarWidth > 0 ? measuredScrollbarWidth + 2 : getScrollbarWidth() + 2;
    const usableWidth = container.offsetWidth - scrollbarWidth - paddingLeft - paddingRight;
    const totalGutterX = gutterX * (columnCount - 1);
    const columnWidth = Math.floor((usableWidth - totalGutterX) / columnCount);

    const columnHeights = new Array(columnCount).fill(0);
    const processedItems = [];

    for (let index = 0; index < items.length; index++) {
        const item = items[index];
        const newItem = { ...item };

        // Find the shortest column
        const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));
        
        const originalWidth = item.width;
        const originalHeight = item.height;

        newItem.columnWidth = columnWidth;
        newItem.left = shortestColumnIndex * (columnWidth + gutterX);
        newItem.imageHeight = Math.round((columnWidth * originalHeight) / originalWidth);
        newItem.columnHeight = newItem.imageHeight + footer + header;
        newItem.top = columnHeights[shortestColumnIndex];

        columnHeights[shortestColumnIndex] += newItem.columnHeight + gutterY;

        processedItems.push(newItem);
    }

    return processedItems;
}
