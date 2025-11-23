import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

// Required to resolve __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputPath = path.join(__dirname, 'src', 'pages.json');

const totalPages = 100;
const itemsPerPage = 40;

const generateRandomItem = (indexOffset, page, index) => {
    const width = Math.floor(Math.random() * 300) + 200;
    const height = Math.floor(Math.random() * 300) + 200;

    const item = {
        id: uuidv4(),
        width,
        height,
        page: page + 1,
        index,
    };

    // Each page should have examples of different types
    const itemIndexInPage = index % itemsPerPage;

    // First item: video example
    if (itemIndexInPage === 0) {
        item.type = 'video';
        // Using a sample video URL (you can replace with actual video URLs)
        item.src = `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4`;
    }
    // Second item: not found example
    else if (itemIndexInPage === 1) {
        item.notFound = true;
        item.src = `https://picsum.photos/id/${indexOffset}/${width}/${height}`;
    }
    // Third item: invalid path that will fail to load
    else if (itemIndexInPage === 2) {
        item.src = `https://invalid-domain-that-does-not-exist-${indexOffset}.com/image.jpg`;
    }
    // Rest: normal images
    else {
        item.type = 'image';
        item.src = `https://picsum.photos/id/${indexOffset}/${width}/${height}`;
    }

    return item;
};

const pages = [];

for (let page = 0; page < totalPages; page++) {
    const pageItems = Array.from({ length: itemsPerPage }, (_, index) =>
        generateRandomItem(page * itemsPerPage + index, page, index)
    );

    pages.push({
        page: page + 1,
        items: pageItems,
    });
}

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, JSON.stringify(pages, null, 2));

console.log(`✅ Generated ${totalPages} pages (${itemsPerPage} items each) at ${outputPath}`);
