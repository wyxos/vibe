export default function calculateLayout(items, container, columnCount, gutterX = 0, gutterY = 0) {
    const scrollbarWidth = container.offsetWidth - container.clientWidth;
    const usableWidth = container.offsetWidth - scrollbarWidth;
    const totalGutterX = gutterX * (columnCount - 1);
    const columnWidth = Math.floor((usableWidth - totalGutterX) / columnCount);

    const columnHeights = new Array(columnCount).fill(0);
    const processedItems = [];

    for (let index = 0; index < items.length; index++) {
        const item = items[index];
        const newItem = { ...item };

        const col = index % columnCount;
        const originalWidth = item.width;
        const originalHeight = item.height;

        newItem.columnWidth = columnWidth;
        newItem.left = col * (columnWidth + gutterX);
        newItem.columnHeight = Math.round((columnWidth * originalHeight) / originalWidth);
        newItem.top = columnHeights[col];

        columnHeights[col] += newItem.columnHeight + gutterY;

        processedItems.push(newItem);
    }

    return processedItems;
}
