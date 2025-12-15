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

const generateRandomItem = (indexOffset, page, index, specialType = null) => {
    const width = Math.floor(Math.random() * 300) + 200;
    const height = Math.floor(Math.random() * 300) + 200;

    const item = {
        id: uuidv4(),
        width,
        height,
        page: page + 1,
        index,
    };

    // Handle special item types
    if (specialType === 'video') {
        item.type = 'video';
        item.src = `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4`;
    } else if (specialType === 'notFound') {
        item.notFound = true;
        // Use a high ID that likely doesn't exist for testing 404 behavior
        item.src = `https://picsum.photos/id/99999/${width}/${height}`;
    } else if (specialType === 'invalid') {
        item.src = `https://invalid-domain-that-does-not-exist-${indexOffset}.com/image.jpg`;
    } else {
        // Normal image - use seeded random to ensure valid images
        item.type = 'image';
        item.src = `https://picsum.photos/seed/${indexOffset}/${width}/${height}`;
    }

    return item;
};

// Helper function to shuffle array (Fisher-Yates algorithm)
const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
};

const pages = [];

for (let page = 0; page < totalPages; page++) {
    // Create array of indices and shuffle them
    const indices = Array.from({ length: itemsPerPage }, (_, i) => i);
    const shuffledIndices = shuffleArray(indices);

    // Select random positions for special items (first 3 shuffled indices)
    const videoIndex = shuffledIndices[0];
    const notFoundIndex = shuffledIndices[1];
    const invalidIndex = shuffledIndices[2];

    // Generate all items
    const pageItems = Array.from({ length: itemsPerPage }, (_, index) => {
        const indexOffset = page * itemsPerPage + index;
        let specialType = null;

        // Determine if this index should be a special item
        if (index === videoIndex) {
            specialType = 'video';
        } else if (index === notFoundIndex) {
            specialType = 'notFound';
        } else if (index === invalidIndex) {
            specialType = 'invalid';
        }

        return generateRandomItem(indexOffset, page, index, specialType);
    });

    pages.push({
        page: page + 1,
        items: pageItems,
    });
}

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, JSON.stringify(pages, null, 2));

console.log(`✅ Generated ${totalPages} pages (${itemsPerPage} items each) at ${outputPath}`);
